import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { LoginDto } from './login.dto';

export class SignupDto extends LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  lastName: string;
}
