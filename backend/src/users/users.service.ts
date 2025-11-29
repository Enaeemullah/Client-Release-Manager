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
  firstName: string | null;
  lastName: string | null;
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

  async create(
    email: string,
    passwordHash: string,
    options?: {
      firstName?: string | null;
      lastName?: string | null;
    },
  ) {
    const normalizedFirstName = this.normalizeString(options?.firstName ?? null);
    const normalizedLastName = this.normalizeString(options?.lastName ?? null);
    const defaultDisplayName = this.buildDisplayName(normalizedFirstName, normalizedLastName, email);
    const user = this.usersRepository.create({
      email,
      passwordHash,
      firstName: normalizedFirstName ?? null,
      lastName: normalizedLastName ?? null,
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

    if (dto.firstName !== undefined) {
      user.firstName = this.normalizeString(dto.firstName);
    }

    if (dto.lastName !== undefined) {
      user.lastName = this.normalizeString(dto.lastName);
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
    const { id, email, firstName, lastName, displayName, avatarUrl, jobTitle, location, bio, phoneNumber } = user;
    return {
      id,
      email,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      displayName: displayName ?? null,
      avatarUrl: avatarUrl ?? null,
      jobTitle: jobTitle ?? null,
      location: location ?? null,
      bio: bio ?? null,
      phoneNumber: phoneNumber ?? null,
    };
  }

  private buildDisplayName(firstName?: string | null, lastName?: string | null, fallbackEmail?: string) {
    const parts = [firstName, lastName].filter((value): value is string => Boolean(value && value.trim()));

    if (parts.length) {
      return parts.map((value) => value.trim()).join(' ');
    }

    if (!fallbackEmail) {
      return null;
    }

    return fallbackEmail.includes('@') ? fallbackEmail.split('@')[0] : fallbackEmail;
  }

  private normalizeString(value?: string | null) {
    if (value === undefined || value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
}
