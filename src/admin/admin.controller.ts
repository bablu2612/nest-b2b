import { Body, Controller, Get, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { UpdateStatusDto } from './dto/update-status.dto';
import { DeleteUserDto } from 'src/user/dto/delete-user.dto';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService:AdminService){}
     @UseGuards(JwtAuthGuard)
      @Post('update-user-status')
      async updateUserStatus(@Body() body: UpdateStatusDto,@Req() req: Request,@Res() res:Response) {
        return this.adminService.updateUserStatus(body,res);
      }
      @UseGuards(JwtAuthGuard)
      @Post('update-report-status')
      async updateReportStatus(@Body() body: UpdateStatusDto,@Res() res:Response) {
        return this.adminService.updateReportStatus(body,res);
      }

      @UseGuards(JwtAuthGuard)
      @Get('get-users')
      async getAllUsers(@Req() req:Request,@Res() res:Response) {
        return this.adminService.getAllUsers(req,res);
      }

     @UseGuards(JwtAuthGuard)
      @Get('get-guests')
      async getAllGuests(@Req() req:Request,@Res() res:Response) {
        return this.adminService.getAllGuests(req,res);
      }

    @UseGuards(JwtAuthGuard)
      @Get('get-reports')
      async getAllReports(@Req() req:Request,@Res() res:Response) {
        return this.adminService.getAllReports(req,res);
      }

      @UseGuards(JwtAuthGuard)
      @Put('delete-user')
      async deleteUser(@Body() body: DeleteUserDto) {
        return this.adminService.deleteUser(body);
      }

       @UseGuards(JwtAuthGuard)
      @Put('delete-guest')
      async deleteGuest(@Body() body: DeleteUserDto) {
        return this.adminService.deleteGuest(body);
      }

       @UseGuards(JwtAuthGuard)
      @Put('delete-report')
      async deleteReport(@Body() body: DeleteUserDto) {
        return this.adminService.deleteReport(body);
      }
    
}
