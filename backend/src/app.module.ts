import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ReleasesModule } from './releases/releases.module';
import { ProjectsModule } from './projects/projects.module';
import { resolve } from 'node:path';

const envFilePath = (() => {
  const env = process.env.NODE_ENV ?? 'development';
  const envFileMap: Record<string, string[]> = {
    development: ['.env-development', '.env'],
    test: ['.env-test', '.env'],
    production: ['.env'],
  };

  const files = envFileMap[env] ?? envFileMap.development;
  return files.map((file) => resolve(__dirname, '..', file));
})();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: Number(config.get('DATABASE_PORT', 3306)),
        username: config.get<string>('DATABASE_USER', 'root'),
        password: config.get<string>('DATABASE_PASSWORD', ''),
        database: config.get<string>('DATABASE_NAME', 'verto'),
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),
    UsersModule,
    AuthModule,
    ReleasesModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
