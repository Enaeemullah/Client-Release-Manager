import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { normalizeKey } from '../shared/normalize-key';
import { Release } from './release.entity';
import { UpsertReleaseDto } from './dto/upsert-release.dto';
import { ReleasePayload, ReleasesResponse } from './releases.types';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class ReleasesService {
  constructor(
    @InjectRepository(Release)
    private readonly releasesRepository: Repository<Release>,
    private readonly projectsService: ProjectsService,
  ) {}

  async getReleasesForUser(userId: string): Promise<ReleasesResponse> {
    const projectIds = await this.projectsService.getAccessibleProjectIds(userId);

    if (projectIds.length === 0) {
      return {};
    }

    const releases = await this.releasesRepository.find({
      where: { projectId: In(projectIds) },
      order: {
        client: 'ASC',
        environment: 'ASC',
      },
    });

    return releases.reduce<ReleasesResponse>((acc, release) => {
      if (!acc[release.client]) {
        acc[release.client] = {};
      }

      acc[release.client][release.environment] = this.buildPayload(release);
      return acc;
    }, {});
  }

  async upsertRelease(userId: string, dto: UpsertReleaseDto): Promise<ReleasesResponse> {
    const client = normalizeKey(dto.client);
    const environment = normalizeKey(dto.environment);

    const project = await this.projectsService.ensureProjectForUser(userId, dto.client);

    let release = await this.releasesRepository.findOne({
      where: { projectId: project.id, environment },
    });

    if (!release) {
      release = this.releasesRepository.create({
        projectId: project.id,
        client,
        environment,
        branch: dto.branch,
        version: dto.version,
        build: dto.build,
        date: dto.date,
      });
    } else {
      release.branch = dto.branch;
      release.version = dto.version;
      release.build = dto.build;
      release.date = dto.date;
      release.client = client;
    }

    await this.releasesRepository.save(release);
    await this.projectsService.recordActivity(project.id, userId, 'release_upserted', {
      environment,
      releaseId: release.id,
      branch: release.branch,
      version: release.version,
      build: release.build,
      date: release.date,
    });
    return this.getReleasesForUser(userId);
  }

  async deleteRelease(
    userId: string,
    clientParam: string,
    envParam: string,
  ): Promise<ReleasesResponse> {
    const client = normalizeKey(clientParam);
    const environment = normalizeKey(envParam);

    const project = await this.projectsService.findAccessibleProjectBySlug(userId, client);

    if (!project) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const release = await this.releasesRepository.findOne({
      where: { projectId: project.id, environment },
    });

    if (!release) {
      throw new NotFoundException('Release not found');
    }

    const metadata = {
      environment,
      releaseId: release.id,
      branch: release.branch,
      version: release.version,
      build: release.build,
      date: release.date,
    };

    await this.releasesRepository.remove(release);
    await this.projectsService.recordActivity(project.id, userId, 'release_deleted', metadata);
    return this.getReleasesForUser(userId);
  }

  private buildPayload(release: Release): ReleasePayload {
    return {
      branch: release.branch,
      version: release.version,
      build: release.build,
      date: release.date,
    };
  }
}
