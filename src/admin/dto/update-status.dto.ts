import {  IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsString()
  status: string;

   @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  note?:string;

}
