// src/user/user.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
// import { CreateUserDto, LoginDto, UpdateUserDto, DeleteUserDto } from './dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// import { DeleteUserDto } from './dto/delete-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { CheckUserExistsDto } from './dto/check-user-exist.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('sign-up')
  async createUser(@Body() body: CreateUserDto,@Res() res:Response) {
    return this.userService.createUser(body,res);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getAll')
  async getAllUsers(@Res() res:Response) {
    return this.userService.getAllUsers(res);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get/:id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.userService.updateUser(id, body);
  }


  @UseGuards(JwtAuthGuard)
  @Get('get-current-user')
  async getCurrentUser(@Req() req: Request) {
    const { email } = req.user as any;
    return this.userService.getCurrentUser(email);
  }
@Post('check-email-exist')
  async checkEmailExist(@Body() body: CheckUserExistsDto,@Res() res:Response) {
    
    return this.userService.checkEmailExist(body,res);
  }

  // @UseGuards(JwtAuthGuard)
  // @Put('delete')
  // async deleteUser(@Body() body: DeleteUserDto) {
  //   return this.userService.deleteUser(body);
  // }

  // @UseGuards(JwtAuthGuard)
  // @Get('get-current-user')
  // async getCurrentUser(@Req() req: Request) {
  //   const { email } = req.user as any;
  //   return this.userService.getCurrentUser(email);
  // }

  @Post('login')
  async login(@Body() body: LoginDto,@Res() res:Response) {
    return this.userService.login(body, res);
  }

  @Post('create-payment-intent')
  async createPaymentIntent(@Body() body: { amount: number; currency?: string; customer_email: string }) {
    return this.userService.createPaymentIntent(body);
  }

    @Post('update-password')
    async updatePassword(@Req() req: Request,@Body() body: { password: string,new_password: string  },@Res() res:Response) {
      const { email } = req.user as any;
      return this.userService.updatePassword(email,body,res);
    }
     @Post('forgot-password')
      async forgotPassword( body: { email: string },@Res() res:Response) {
      return this.userService.forgotPassword(body,res);
    }

    @Get('verify-token')
      async verifyToken( @Req() req:Request,@Res() res:Response) {
      return this.userService.verifyToken(req,res);
    }
    //  @Post('reset-password')
    // async resetPassword( body: { email: string },@Res() res:Response) {
      
    //   return this.userService.resetPassword(body,res);
    // }

}
