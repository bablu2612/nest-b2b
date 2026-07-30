import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PostType } from '../enums/post-type.enum';

export class UpdatePostDto extends PartialType(CreatePostDto) {
    @IsNotEmpty()
    @IsString()
    @IsEnum(PostType)
    post_type: PostType;
        
    @IsNotEmpty()
    @IsString()
    category_id: string;
  
    @IsNotEmpty()
    @IsString()
    title: string;
  
    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsString()
    country: string;

    
    @IsNotEmpty()
    @IsString()
    currency: string;

    @IsNotEmpty()
    @IsString()
    price: string;

    @IsNotEmpty()
   quantity: number;

  // Optional fields to pass address data
  
   @IsOptional() additional_info?: string;

//     @IsNotEmpty()
//   photos: Array<string>;


          
        
        
    
}
