import {  IsNotEmpty, IsString } from 'class-validator';

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsString()
  status: string;

   @IsNotEmpty()
  @IsString()
  id: string;

}
