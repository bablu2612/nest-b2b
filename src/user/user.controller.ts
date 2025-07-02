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
} from '@nestjs/common';
import { UserService } from './user.service';
// import { CreateUserDto, LoginDto, UpdateUserDto, DeleteUserDto } from './dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// import { DeleteUserDto } from './dto/delete-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('sign-up')
  async createUser(@Body() body: CreateUserDto) {
    return this.userService.createUser(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getAll')
  async getAllUsers() {
    return this.userService.getAllUsers();
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
  async login(@Body() body: LoginDto) {
    return this.userService.login(body);
  }

  @Post('create-payment-intent')
  async createPaymentIntent(@Body() body: { amount: number; currency?: string; customer_email: string }) {
    return this.userService.createPaymentIntent(body);
  }
}
