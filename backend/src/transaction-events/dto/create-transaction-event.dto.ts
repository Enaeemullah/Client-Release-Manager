import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTransactionEventDto {
  @IsString()
  @IsNotEmpty()
  client: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  petEventCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  petEventDesc: string;
}
