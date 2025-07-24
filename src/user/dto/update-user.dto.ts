import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsNotEmpty()
  @IsString()
  f_name?: string;

  @IsNotEmpty()
  @IsString()
  l_name?: string;

  // @IsOptional()
  // @IsString()
  // email?: string;


   @IsNotEmpty()
    amount: number;
  
    @IsOptional()
    currency?: string;
  
    @IsOptional()
    paymentId?: string;
  
    @IsOptional()
    paymentMode?: string;
  
    
  
    // Optional fields to pass company data
    @IsOptional() company_name?: string;
    @IsOptional() street_name?: string;
    @IsOptional() building_no?: string;
    @IsOptional() room_no?: string;
    @IsOptional() zip_code?: string;
    @IsOptional() city?: string;
    @IsOptional() country?: string;
    @IsOptional() stars?: number;
    @IsOptional() is_part_of_association?: boolean;
}
