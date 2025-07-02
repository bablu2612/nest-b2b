import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  f_name?: string;

  @IsOptional()
  @IsString()
  l_name?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
