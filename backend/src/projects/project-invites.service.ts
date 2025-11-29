import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { normalizeKey } from '../shared/normalize-key';
import { ProjectInvite } from './project-invite.entity';
import { ProjectsService } from './projects.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

const DEFAULT_INVITE_TTL_HOURS = 72;

@Injectable()
export class ProjectInvitesService {
  constructor(
    @InjectRepository(ProjectInvite)
    private readonly invitesRepository: Repository<ProjectInvite>,
    private readonly projectsService: ProjectsService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async createInvite(ownerId: string, client: string, rawEmail: string) {
    const project = await this.projectsService.findOwnedProjectBySlug(ownerId, client);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const email = normalizeKey(rawEmail);

    if (!email) {
      throw new BadRequestException('Email is required');
    }
    const inviter = await this.usersService.findById(ownerId);

    if (!inviter) {
      throw new NotFoundException('Inviter not found');
    }

    if (inviter.email === email) {
      throw new BadRequestException('You cannot invite yourself');
    }

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      const alreadyMember = await this.projectsService.isUserInProject(project.id, existingUser.id);
      if (alreadyMember) {
        throw new ConflictException('User already has access to this project');
      }
    }

    let invite = await this.invitesRepository.findOne({
      where: { projectId: project.id, email },
    });

    if (!invite) {
      invite = this.invitesRepository.create({
        projectId: project.id,
        invitedById: ownerId,
        email,
        token: '',
        expiresAt: new Date(),
        acceptedAt: null,
      });
    }

    invite.token = randomBytes(32).toString('hex');
    invite.expiresAt = this.buildExpiryDate();
    invite.acceptedAt = null;

    await this.invitesRepository.save(invite);

    const inviteUrl = this.buildInviteUrl(invite.token);

    await this.emailService.sendProjectInvite(email, {
      inviteLink: inviteUrl,
      inviterEmail: inviter.email,
      projectName: project.name,
    });

    return { success: true };
  }

  async getInviteDetails(token: string) {
    const invite = await this.findActiveInvite(token);
    return {
      email: invite.email,
      projectName: invite.project.name,
      client: invite.project.slug,
      inviterEmail: invite.invitedBy?.email ?? '',
      expiresAt: invite.expiresAt.toISOString(),
    };
  }

  async consumeInvite(token: string, userId: string) {
    const invite = await this.findActiveInvite(token);
    await this.projectsService.ensureMembership(invite.projectId, userId);
    await this.invitesRepository.remove(invite);
    return invite;
  }

  async getPendingInvitesForUser(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const invites = await this.invitesRepository.find({
      where: {
        email: user.email,
        acceptedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: {
        project: true,
        invitedBy: true,
      },
      order: {
        expiresAt: 'ASC',
      },
    });

    return invites.map((invite) => this.toPendingInvite(invite));
  }

  async acceptInviteForUser(inviteId: string, userId: string) {
    const invite = await this.findInviteForUser(inviteId, userId);
    await this.projectsService.ensureMembership(invite.projectId, userId);
    await this.invitesRepository.remove(invite);
    return { success: true };
  }

  async rejectInviteForUser(inviteId: string, userId: string) {
    const invite = await this.findInviteForUser(inviteId, userId);
    await this.invitesRepository.remove(invite);
    return { success: true };
  }

  private async findActiveInvite(token: string) {
    const normalizedToken = token.trim();
    const invite = await this.invitesRepository.findOne({
      where: { token: normalizedToken },
      relations: ['project', 'invitedBy', 'project.owner'],
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.acceptedAt) {
      throw new BadRequestException('Invite already used');
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invite expired');
    }

    return invite;
  }

  private async findInviteForUser(inviteId: string, userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const invite = await this.invitesRepository.findOne({
      where: {
        id: inviteId,
        email: user.email,
      },
      relations: ['project', 'invitedBy', 'project.owner'],
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      await this.invitesRepository.remove(invite);
      throw new BadRequestException('Invite expired');
    }

    return invite;
  }

  private toPendingInvite(invite: ProjectInvite) {
    return {
      id: invite.id,
      email: invite.email,
      expiresAt: invite.expiresAt.toISOString(),
      project: {
        id: invite.project.id,
        name: invite.project.name,
        slug: invite.project.slug,
      },
      invitedBy: invite.invitedBy
        ? {
            id: invite.invitedBy.id,
            email: invite.invitedBy.email,
            displayName: invite.invitedBy.displayName ?? null,
            firstName: invite.invitedBy.firstName ?? null,
            lastName: invite.invitedBy.lastName ?? null,
          }
        : null,
    };
  }

  private buildExpiryDate() {
    const ttlHours = Number(
      this.configService.get<string>('PROJECT_INVITE_TTL_HOURS') ??
        DEFAULT_INVITE_TTL_HOURS,
    );

    const hours = Number.isFinite(ttlHours) ? ttlHours : DEFAULT_INVITE_TTL_HOURS;
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  private buildInviteUrl(token: string) {
    const clientUrl =
      this.configService.get<string>('CLIENT_URL') ?? 'http://localhost:5173';
    const cleanBase = clientUrl.replace(/\/$/, '');
    return `${cleanBase}/?inviteToken=${encodeURIComponent(token)}`;
  }
}
