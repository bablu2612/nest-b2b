import { IsEmail, IsNotEmpty } from 'class-validator';

export class CheckUserExistsDto {

 
  @IsNotEmpty()
  @IsEmail()
  email: string;

  }
