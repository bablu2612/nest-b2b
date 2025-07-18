

import { IsEmail, IsNotEmpty } from 'class-validator';

export class DeleteUserDto {
  @IsNotEmpty()
  ids: Array<string>;

  
}
