import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';


export class CreateGuestDto {
@IsNotEmpty()
  @IsString()
  first_name: string;

  @IsNotEmpty()
  @IsString()
  last_name: string;

 @IsOptional() company_name?: string;

 @IsNotEmpty()
  @IsString()
  nationality: string;

   @IsNotEmpty()
  @IsString()
  document_type: string;

   @IsNotEmpty()
  @IsString()
  document_number: string;

@IsOptional() telephone?: string;
  @IsEmail()
  email: string;
  @IsOptional()
  files: Array<string>;

  // Optional fields to pass address data
  
  @IsOptional() street_name?: string;
  @IsOptional() building_no?: string;
  @IsOptional() appartment_no?: string;
  @IsOptional() zip_code?: string;
  @IsOptional() city?: string;
   @IsOptional() country?: string;

}







