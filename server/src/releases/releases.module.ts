import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Release } from './release.entity';
import { ReleasesService } from './releases.service';
import { ReleasesController } from './releases.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Release])],
  providers: [ReleasesService],
  controllers: [ReleasesController],
})
export class ReleasesModule {}
