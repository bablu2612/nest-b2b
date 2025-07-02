import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  f_name: string;

  @IsNotEmpty()
  @IsString()
  l_name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  amount: number;

  @IsOptional()
  currency?: string;

  @IsOptional()
  paymentId?: string;

  // Optional fields to pass company data
  @IsOptional() company_name?: string;
  @IsOptional() street_name?: string;
  @IsOptional() building_no?: string;
  @IsOptional() room_no?: string;
  @IsOptional() zip_code?: string;
  @IsOptional() city?: string;
  @IsOptional() stars?: number;
  @IsOptional() is_part_of_association?: boolean;
}
