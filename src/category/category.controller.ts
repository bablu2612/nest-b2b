import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CategoryService } from './category.service';

@Controller('category')
export class CategoryController {
      constructor(private readonly categoryService: CategoryService) {}
       @UseGuards(JwtAuthGuard)
           @Get('getAllCategory')
            async getAllGuest(@Req() req: Request )  {
              return this.categoryService.getAllCategory();
          }


            @UseGuards(JwtAuthGuard)
           @Get('get-Categories-Count')
            async getCategoriesCountPost(@Req() req: Request )  {

              return this.categoryService.getCategoriesCountPost();
          }
          
}
