import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../security/jwt-auth.guard';
import { CurrentUser } from '../security/user.decorator';
import { JwtPayload } from '../security/jwt-payload.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfileById(user.sub);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Patch('me/password')
  updatePassword(@CurrentUser() user: JwtPayload, @Body() dto: UpdatePasswordDto) {
    return this.usersService.updatePassword(user.sub, dto);
  }
}
