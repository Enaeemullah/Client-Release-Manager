import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { CurrentUser } from '../security/user.decorator';
import { JwtPayload } from '../security/jwt-payload.interface';
import { UpsertReleaseDto } from './dto/upsert-release.dto';
import { ReleasesService } from './releases.service';

@Controller('releases')
@UseGuards(JwtAuthGuard)
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get()
  getReleases(@CurrentUser() user: JwtPayload) {
    return this.releasesService.getReleasesForUser(user.sub);
  }

  @Put(':client/:environment')
  upsertRelease(
    @CurrentUser() user: JwtPayload,
    @Param('client') client: string,
    @Param('environment') environment: string,
    @Body() dto: UpsertReleaseDto,
  ) {
    return this.releasesService.upsertRelease(user.sub, {
      ...dto,
      client,
      environment,
    });
  }

  @Delete(':client/:environment')
  deleteRelease(
    @CurrentUser() user: JwtPayload,
    @Param('client') client: string,
    @Param('environment') environment: string,
  ) {
    return this.releasesService.deleteRelease(user.sub, client, environment);
  }
}
