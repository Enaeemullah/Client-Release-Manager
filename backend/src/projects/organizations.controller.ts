import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { CurrentUser } from '../security/user.decorator';
import type { JwtPayload } from '../security/jwt-payload.interface';
import { ProjectsService } from './projects.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  listOrganizations(@CurrentUser() user: JwtPayload) {
    return this.projectsService.getAccessibleOrganizations(user.sub);
  }

  @Post()
  createOrganization(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrganizationDto) {
    return this.projectsService.createOrganization(user.sub, dto);
  }
}
