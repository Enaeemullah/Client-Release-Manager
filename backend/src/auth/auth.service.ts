import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ProjectInvitesService } from '../projects/project-invites.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly projectInvitesService: ProjectInvitesService,
  ) {}

  async signup(dto: SignupDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.usersService.findByEmail(normalizedEmail);

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create(normalizedEmail, passwordHash, {
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  previewInvite(token: string) {
    return this.projectInvitesService.getInviteDetails(token);
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const invite = await this.projectInvitesService.getInviteDetails(dto.token);
    let user = await this.usersService.findByEmail(invite.email);

    if (!user) {
      if (!dto.password) {
        throw new BadRequestException('Password is required to create your account');
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);
      user = await this.usersService.create(invite.email, passwordHash);
    }

    await this.projectInvitesService.consumeInvite(dto.token, user.id);
    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: User) {
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      token,
      user: this.usersService.toProfile(user),
    };
  }
}
