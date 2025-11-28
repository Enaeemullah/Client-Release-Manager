import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizeKey } from '../shared/normalize-key';
import { Release } from './release.entity';
import { UpsertReleaseDto } from './dto/upsert-release.dto';
import { ReleasePayload, ReleasesResponse } from './releases.types';

@Injectable()
export class ReleasesService {
  constructor(
    @InjectRepository(Release)
    private readonly releasesRepository: Repository<Release>,
  ) {}

  async getReleasesForUser(userId: string): Promise<ReleasesResponse> {
    const releases = await this.releasesRepository.find({
      where: { userId },
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

  async upsertRelease(
    userId: string,
    dto: UpsertReleaseDto,
  ): Promise<ReleasesResponse> {
    const client = normalizeKey(dto.client);
    const environment = normalizeKey(dto.environment);

    let release = await this.releasesRepository.findOne({
      where: { userId, client, environment },
    });

    if (!release) {
      release = this.releasesRepository.create({
        userId,
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
    }

    await this.releasesRepository.save(release);
    return this.getReleasesForUser(userId);
  }

  async deleteRelease(
    userId: string,
    clientParam: string,
    envParam: string,
  ): Promise<ReleasesResponse> {
    const client = normalizeKey(clientParam);
    const environment = normalizeKey(envParam);

    const release = await this.releasesRepository.findOne({
      where: { userId, client, environment },
    });

    if (!release) {
      throw new NotFoundException('Release not found');
    }

    await this.releasesRepository.remove(release);
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
