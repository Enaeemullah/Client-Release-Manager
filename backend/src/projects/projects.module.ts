import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectMember } from './project-member.entity';
import { ProjectInvite } from './project-invite.entity';
import { ProjectsService } from './projects.service';
import { ProjectInvitesService } from './project-invites.service';
import { ProjectsController } from './projects.controller';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { ProjectActivityLog } from './project-activity-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, ProjectInvite, ProjectActivityLog]),
    UsersModule,
    EmailModule,
  ],
  providers: [ProjectsService, ProjectInvitesService],
  exports: [ProjectsService, ProjectInvitesService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
