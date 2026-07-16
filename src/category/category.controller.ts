import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CategoryService } from './category.service';

@Controller('category')
export class CategoryController {
      constructor(private readonly categoryService: CategoryService) {}
       @UseGuards(JwtAuthGuard)
           @Get('getAllCategory')
            async getAllGuest(@Req() req: Request )  {
            //   const { id } = (req as Request & { user: any }).user;
              return this.categoryService.getAllCategory();
          }
}
