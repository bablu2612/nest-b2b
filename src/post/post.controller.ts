import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}
 @UseGuards(JwtAuthGuard)
    @Post('create')
    
    @UseInterceptors(FilesInterceptor('photos', 20, {
    limits: { fileSize: 50 * 1024 * 1024 }, // 5MB
    }))
    
  async create(@UploadedFiles() photos: Express.Multer.File[],@Body() createPostDto: CreatePostDto,@Req() req: Request,@Res() res:Response) {
    
    return this.postService.create(photos,createPostDto,req,res);
    
  }

  @Get()
  findAll() {
    return this.postService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(+id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postService.remove(+id);
  }
}
