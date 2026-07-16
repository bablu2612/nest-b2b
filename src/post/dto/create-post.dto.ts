import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreatePostDto {
    @IsNotEmpty()
      @IsString()
      post_type: string;
    
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

    //    @IsNotEmpty()
    //   @IsString()
    //   user_id: string;

      
    
    
    
}
