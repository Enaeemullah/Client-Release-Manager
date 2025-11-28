import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  location: string | null;
  bio: string | null;
  phoneNumber: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(email: string, passwordHash: string) {
    const defaultDisplayName = email.includes('@') ? email.split('@')[0] : email;
    const user = this.usersRepository.create({
      email,
      passwordHash,
      displayName: defaultDisplayName,
    });

    return this.usersRepository.save(user);
  }

  async getProfileById(userId: string) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toProfile(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.displayName !== undefined) {
      user.displayName = this.normalizeString(dto.displayName);
    }

    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl ? dto.avatarUrl.trim() : null;
    }

    if (dto.jobTitle !== undefined) {
      user.jobTitle = this.normalizeString(dto.jobTitle);
    }

    if (dto.location !== undefined) {
      user.location = this.normalizeString(dto.location);
    }

    if (dto.bio !== undefined) {
      user.bio = dto.bio ? dto.bio.trim() : null;
    }

    if (dto.phoneNumber !== undefined) {
      user.phoneNumber = this.normalizeString(dto.phoneNumber);
    }

    const updated = await this.usersRepository.save(user);
    return this.toProfile(updated);
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);

    if (!matches) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    const updated = await this.usersRepository.save(user);
    return this.toProfile(updated);
  }

  toProfile(user: User): UserProfile {
    const { id, email, displayName, avatarUrl, jobTitle, location, bio, phoneNumber } = user;
    return {
      id,
      email,
      displayName: displayName ?? null,
      avatarUrl: avatarUrl ?? null,
      jobTitle: jobTitle ?? null,
      location: location ?? null,
      bio: bio ?? null,
      phoneNumber: phoneNumber ?? null,
    };
  }

  private normalizeString(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
}
