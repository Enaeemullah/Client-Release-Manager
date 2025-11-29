import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { normalizeKey } from '../shared/normalize-key';
import { Release } from './release.entity';
import { UpsertReleaseDto } from './dto/upsert-release.dto';
import { ReleasePayload, ReleasesResponse } from './releases.types';
import { ProjectsService } from '../projects/projects.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { formatReleaseDate } from 'src/utils/date.utils';

@Injectable()
export class ReleasesService {
  constructor(
    @InjectRepository(Release)
    private readonly releasesRepository: Repository<Release>,
    private readonly projectsService: ProjectsService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
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
    const normalizedCommitMessage = this.normalizeCommitMessage(dto.commitMessage);
    const commitMessageProvided = dto.commitMessage !== undefined;

    let release = await this.releasesRepository.findOne({
      where: { projectId: project.id, environment },
    });

    const isNewRelease = !release;

    if (!release) {
      release = this.releasesRepository.create({
        projectId: project.id,
        client,
        environment,
        branch: dto.branch,
        version: dto.version,
        build: dto.build,
        date: dto.date,
        commitMessage: commitMessageProvided ? normalizedCommitMessage : null,
      });
    } else {
      release.branch = dto.branch;
      release.version = dto.version;
      release.build = dto.build;
      release.date = dto.date;
      release.client = client;
      if (commitMessageProvided) {
        release.commitMessage = normalizedCommitMessage;
      }
    }

    await this.releasesRepository.save(release);
    await this.projectsService.recordActivity(project.id, userId, 'release_upserted', {
      environment,
      releaseId: release.id,
      branch: release.branch,
      version: release.version,
      build: release.build,
      date: release.date,
      commitMessage: release.commitMessage,
    });
    await this.notifyCollaboratorsOfReleaseUpdate({
      project,
      release,
      actorId: userId,
      isNewRelease,
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
      commitMessage: release.commitMessage,
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
      commitMessage: release.commitMessage ?? null,
    };
  }

  private normalizeCommitMessage(value?: string | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private async notifyCollaboratorsOfReleaseUpdate(options: {
    project: { id: string; name: string; slug: string };
    release: Release;
    actorId: string;
    isNewRelease: boolean;
  }) {
    const collaborators = await this.projectsService.getProjectCollaborators(options.project.id);

    if (!collaborators.length) {
      return;
    }

    const recipients = collaborators.filter((user) => user.id !== options.actorId);

    if (!recipients.length) {
      return;
    }

    const actor =
      collaborators.find((user) => user.id === options.actorId) ??
      (await this.usersService.findById(options.actorId));

    const actorName = this.buildUserDisplayName(actor);
    const actorEmail = actor?.email ?? 'unknown';
    const releaseDate = formatReleaseDate(options.release.date) ?? '';

    await Promise.all(
      recipients.map((recipient) =>
        this.emailService.sendReleaseUpdateNotification(recipient.email, {
          projectName: options.project.name,
          projectSlug: options.project.slug,
          environment: options.release.environment,
          version: options.release.version,
          branch: options.release.branch,
          build: options.release.build,
          date: releaseDate,
          commitMessage: options.release.commitMessage ?? null,
          actorName,
          actorEmail,
          isNewRelease: options.isNewRelease,
        }),
      ),
    );
  }

  private buildUserDisplayName(user: User | null | undefined) {
    if (!user) {
      return 'A collaborator';
    }

    if (user.displayName) {
      return user.displayName;
    }

    const nameParts = [user.firstName, user.lastName].filter((part): part is string =>
      Boolean(part && part.trim()),
    );

    if (nameParts.length) {
      return nameParts.join(' ');
    }

    return user.email;
  }
}
