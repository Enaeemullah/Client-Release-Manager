import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { CurrentUser } from '../security/user.decorator';
import type { JwtPayload } from '../security/jwt-payload.interface';
import { ProjectInvitesService } from './project-invites.service';
import { CreateProjectInviteDto } from './dto/create-project-invite.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectInvitesService: ProjectInvitesService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post(':client/invitations')
  inviteUser(
    @CurrentUser() user: JwtPayload,
    @Param('client') client: string,
    @Body() dto: CreateProjectInviteDto,
  ) {
    return this.projectInvitesService.createInvite(user.sub, client, dto.email);
  }

  @Get('activity')
  listActivity(@CurrentUser() user: JwtPayload) {
    return this.projectsService.getActivitySummaries(user.sub);
  }

  @Get(':client/activity')
  getProjectActivity(@CurrentUser() user: JwtPayload, @Param('client') client: string) {
    return this.projectsService.getProjectActivity(user.sub, client);
  }
}
