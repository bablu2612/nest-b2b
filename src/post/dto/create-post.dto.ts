import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { PostType } from "../enums/post-type.enum";

export class CreatePostDto {
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
    address: string;

     @IsOptional()
    @IsString()
    lat: string;

     @IsOptional()
    @IsString()
    long: string;

    @IsNotEmpty()
    @IsString()
    currency: string;
  
    @IsNotEmpty()
    @IsString()
    price: string;

     @IsOptional()
    @IsString()
    weeklyPrice: string;

     @IsOptional()
    @IsString()
    monthlyPrice: string;
  
    @IsNotEmpty()
    quantity: number;

    // Optional fields to pass address data
    
    @IsOptional() additional_info?: string;

     @IsNotEmpty()
    condition: string;

    //     @IsNotEmpty()
    //   photos: Array<string>
}
