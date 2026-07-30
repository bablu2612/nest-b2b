import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res, UseGuards, UseInterceptors, UploadedFiles, Put } from '@nestjs/common';
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

   @UseGuards(JwtAuthGuard)
  @Get('getAllPost')
  findAll(@Req() req: Request,@Res() res:Response) {
    return this.postService.findAll(req,res);
  }

 @UseGuards(JwtAuthGuard)
  @Get('get/:id')
  findOne(@Param('id') _id: string,@Req() req: Request,@Res() res:Response) {
    return this.postService.findOne(_id,req,res);
  }

 @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('photos', 20, {
    limits: { fileSize: 50 * 1024 * 1024 }, // 5MB
    }))
    
  
  @Patch('updatePost/:id')
  update(@Param('id') id: string, @UploadedFiles() photos: Express.Multer.File[],@Body() updatePostDto: UpdatePostDto,@Req() req: Request,@Res() res:Response) {
   // return this.postService.update(id,photos, updatePostDto,req,res);
  }

   @UseGuards(JwtAuthGuard)
  @Post('deletePost')
  remove(@Req() req: Request,@Res() res:Response) {
    return this.postService.remove(req,res);
  }

 @UseGuards(JwtAuthGuard)
   @Get('get-current-user-post')
  getCurrentPost(@Req() req: Request,@Res() res:Response) {
      const { id } = (req as Request & { user: any }).user;
    return this.postService.getCurrentPost(id,req,res);
  }

   @UseGuards(JwtAuthGuard)
   @Get('get-history-post')
  getHistoryPost(@Req() req: Request,@Res() res:Response) {
      const { id } = (req as Request & { user: any }).user;
    return this.postService.getHistoryPost(id,req,res);
  }
}
