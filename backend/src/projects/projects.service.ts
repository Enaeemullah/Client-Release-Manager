import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { normalizeKey } from '../shared/normalize-key';
import { Project } from './project.entity';
import { ProjectMember, ProjectRole } from './project-member.entity';
import { ProjectActivityAction, ProjectActivityLog } from './project-activity-log.entity';
import { User } from '../users/user.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';

const DEFAULT_LOG_LIMIT = 10;

export interface ProjectActivityUserDto {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
}

export interface ProjectActivityLogDto {
  id: string;
  action: ProjectActivityAction;
  createdAt: string;
  metadata: Record<string, unknown> | null;
  user: ProjectActivityUserDto | null;
}

export interface ProjectActivitySummaryDto {
  projectId: string;
  name: string;
  slug: string;
  lastUpdatedAt: string | null;
  lastUpdatedBy: ProjectActivityUserDto | null;
  recentLogs: ProjectActivityLogDto[];
}

export interface OrganizationSummaryDto {
  id: string;
  name: string;
  code: string;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly membersRepository: Repository<ProjectMember>,
    @InjectRepository(ProjectActivityLog)
    private readonly activityRepository: Repository<ProjectActivityLog>,
  ) {}

  async getAccessibleProjectIds(userId: string): Promise<string[]> {
    const [owned, memberships] = await Promise.all([
      this.projectsRepository.find({
        where: { ownerId: userId },
        select: { id: true },
      }),
      this.membersRepository.find({
        where: { userId },
        select: { projectId: true },
      }),
    ]);

    const ids = new Set<string>();
    owned.forEach((project) => ids.add(project.id));
    memberships.forEach((member) => ids.add(member.projectId));

    return Array.from(ids);
  }

  async findAccessibleProjectBySlug(userId: string, slug: string) {
    const normalizedSlug = normalizeKey(slug);

    const project = await this.projectsRepository
      .createQueryBuilder('project')
      .leftJoin(
        ProjectMember,
        'member',
        'member.projectId = project.id AND member.userId = :userId',
        { userId },
      )
      .where(
        '(project.ownerId = :userId OR member.userId IS NOT NULL) AND project.slug = :slug',
        { userId, slug: normalizedSlug },
      )
      .getOne();

    return project ?? null;
  }

  async findOwnedProjectBySlug(ownerId: string, slug: string) {
    return this.projectsRepository.findOne({
      where: { ownerId, slug: normalizeKey(slug) },
    });
  }

  async ensureProjectForUser(userId: string, clientName: string) {
    const slug = normalizeKey(clientName);
    const existing = await this.findAccessibleProjectBySlug(userId, slug);
    if (existing) {
      return existing;
    }

    const project = this.projectsRepository.create({
      ownerId: userId,
      slug,
      name: clientName.trim() || slug,
    });

    const saved = await this.projectsRepository.save(project);
    await this.ensureMembership(saved.id, userId, 'owner');
    await this.recordActivity(saved.id, userId, 'project_created', {
      name: saved.name,
    });
    return saved;
  }

  async ensureMembership(projectId: string, userId: string, role: ProjectRole = 'editor') {
    const existing = await this.membersRepository.findOne({
      where: { projectId, userId },
    });

    if (existing) {
      if (existing.role !== role) {
        existing.role = role;
        await this.membersRepository.save(existing);
      }

      return existing;
    }

    const member = this.membersRepository.create({
      projectId,
      userId,
      role,
    });

    return this.membersRepository.save(member);
  }

  async isUserInProject(projectId: string, userId: string) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      select: { ownerId: true, id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId === userId) {
      return true;
    }

    const membership = await this.membersRepository.findOne({
      where: { projectId, userId },
    });

    return Boolean(membership);
  }

  async recordActivity(
    projectId: string,
    userId: string | null,
    action: ProjectActivityAction,
    metadata?: Record<string, unknown>,
  ) {
    const log = this.activityRepository.create({
      projectId,
      userId: userId ?? null,
      action,
      metadata: metadata ?? null,
    });

    await this.activityRepository.save(log);
    await this.projectsRepository.update(projectId, {
      lastUpdatedById: userId ?? null,
      lastActivityAt: new Date(),
    });
  }

  async getActivitySummaries(
    userId: string,
    options?: { logLimit?: number },
  ): Promise<Record<string, ProjectActivitySummaryDto>> {
    const projectIds = await this.getAccessibleProjectIds(userId);
    if (projectIds.length === 0) {
      return {};
    }

    const logLimit = options?.logLimit ?? DEFAULT_LOG_LIMIT;

    const projects = await this.projectsRepository.find({
      where: { id: In(projectIds) },
      relations: { lastUpdatedBy: true },
    });

    const entries = await Promise.all(
      projects.map(async (project) => {
        const logs = await this.activityRepository.find({
          where: { projectId: project.id },
          order: { createdAt: 'DESC' },
          take: logLimit,
          relations: { user: true },
        });

        return [project.slug, this.buildActivitySummary(project, logs)] as const;
      }),
    );

    return entries.reduce<Record<string, ProjectActivitySummaryDto>>((acc, [slug, summary]) => {
      acc[slug] = summary;
      return acc;
    }, {});
  }

  async getProjectActivity(
    userId: string,
    client: string,
    options?: { logLimit?: number },
  ): Promise<ProjectActivitySummaryDto> {
    const project = await this.findAccessibleProjectBySlug(userId, client);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const fullProject = await this.projectsRepository.findOne({
      where: { id: project.id },
      relations: { lastUpdatedBy: true },
    });

    if (!fullProject) {
      throw new NotFoundException('Project not found');
    }

    const logs = await this.activityRepository.find({
      where: { projectId: project.id },
      order: { createdAt: 'DESC' },
      take: options?.logLimit ?? 50,
      relations: { user: true },
    });

    return this.buildActivitySummary(fullProject, logs);
  }

  async getProjectCollaborators(projectId: string): Promise<User[]> {
    const [project, members] = await Promise.all([
      this.projectsRepository.findOne({
        where: { id: projectId },
        relations: { owner: true },
      }),
      this.membersRepository.find({
        where: { projectId },
        relations: { user: true },
      }),
    ]);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const collaborators = new Map<string, User>();

    members.forEach((member) => {
      if (member.user) {
        collaborators.set(member.user.id, member.user);
      }
    });

    if (project.owner) {
      collaborators.set(project.owner.id, project.owner);
    }

    return Array.from(collaborators.values());
  }

  private buildActivitySummary(project: Project, logs: ProjectActivityLog[]): ProjectActivitySummaryDto {
    return {
      projectId: project.id,
      name: project.name,
      slug: project.slug,
      lastUpdatedAt: project.lastActivityAt ? project.lastActivityAt.toISOString() : null,
      lastUpdatedBy: this.toActivityUser(project.lastUpdatedBy ?? null),
      recentLogs: logs.map((log) => this.toActivityLogDto(log)),
    };
  }

  private toActivityLogDto(log: ProjectActivityLog): ProjectActivityLogDto {
    return {
      id: log.id,
      action: log.action,
      createdAt: log.createdAt.toISOString(),
      metadata: log.metadata ?? null,
      user: this.toActivityUser(log.user ?? null),
    };
  }

  private toActivityUser(user: User | null): ProjectActivityUserDto | null {
    if (!user) {
      return null;
    }

    const { id, email, displayName, firstName, lastName } = user;
    return {
      id,
      email,
      displayName: displayName ?? null,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
    };
  }

  async getAccessibleOrganizations(userId: string): Promise<OrganizationSummaryDto[]> {
    const projectIds = await this.getAccessibleProjectIds(userId);
    if (projectIds.length === 0) {
      return [];
    }

    const projects = await this.projectsRepository.find({
      where: { id: In(projectIds) },
      order: { name: 'ASC' },
    });

    return projects.map((project) => this.toOrganizationSummary(project));
  }

  async createOrganization(userId: string, dto: CreateOrganizationDto): Promise<OrganizationSummaryDto> {
    const slug = normalizeKey(dto.code);
    if (!slug) {
      throw new BadRequestException('Organization code is required.');
    }

    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Organization name is required.');
    }

    const existing = await this.findAccessibleProjectBySlug(userId, slug);
    if (existing) {
      throw new ConflictException('An organization with this code already exists.');
    }

    const project = this.projectsRepository.create({
      ownerId: userId,
      slug,
      name,
    });

    const saved = await this.projectsRepository.save(project);
    await this.ensureMembership(saved.id, userId, 'owner');
    await this.recordActivity(saved.id, userId, 'project_created', {
      name: saved.name,
    });

    return this.toOrganizationSummary(saved);
  }

  private toOrganizationSummary(project: Project): OrganizationSummaryDto {
    return {
      id: project.id,
      name: project.name,
      code: project.slug,
    };
  }
}
