import { Body, Controller, Get, Post, Req, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { GuestService } from './guest.service';
import { CreateGuestDto } from './dto/create-guest.dto/create-guest.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';


@Controller('guest')
export class GuestController {
     constructor(private readonly guestService: GuestService) {}

    @UseGuards(JwtAuthGuard)
    @Post('ragister')
    
    @UseInterceptors(FilesInterceptor('files', 5, {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }))
    async createGuest( @UploadedFiles() files: Express.Multer.File[], @Body() body: any,@Req() req: Request)  {

        const { id } = (req as Request & { user: any }).user;
        return this.guestService.createGuest(files,body,id);
    }

 @UseGuards(JwtAuthGuard)
     @Get('getAllGuest')
      async getAllGuest(@Req() req: Request )  {

        const { id } = (req as Request & { user: any }).user;
        return this.guestService.getAllGuest(id);
    }


}
 
  