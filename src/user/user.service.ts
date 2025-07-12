import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';

import { User, UserDocument } from '../schemas/user.schema';
import { Company, CompanyDocument } from '../schemas/company.schema';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from '../user/dto/login.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { CheckUserExistsDto } from './dto/check-user-exist.dto';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // apiVersion: '2022-11-15',
});

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private jwtService: JwtService,
  ) {}

  async createUser(dto: CreateUserDto) {
    const { email, password, amount, currency = 'chf', paymentMode,paymentId, ...companyInfo } = dto;

    const userExists = await this.userModel.findOne({ email });
    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({ ...dto, password: hashedPassword });
      
    await this.companyModel.create({ ...companyInfo, user_id: user._id });

    const price = amount / 100;
    await this.paymentModel.create({
      user_id: user._id,
      price,
      currency,
      paymentId,
      current_date: new Date(),
      paymentMode: paymentMode
    });
    const { password: _, ...userWithoutPassword } = user.toObject(); 
    //const token = this.jwtService.sign({ id: user._id, email: user.email });

    return { message: 'User created successfully', user: userWithoutPassword ,paymentMode: paymentMode};
  }

  async getAllUsers() {
    return this.userModel.aggregate([
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: 'user_id',
          as: 'companyData',
        },
      },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'user_id',
          as: 'paymentData',
        },
      },
      { $project: { password: 0 } },
    ]);
  }

  async getUser(id) {
    const [user] = await this.userModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: 'user_id',
          as: 'companyData',
        },
      },
       {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'user_id',
          as: 'paymentData',
        },
      },
      { $project: { password: 0 } },
    ]);
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const { companyData, ...userData } = dto as any;
    await this.userModel.findByIdAndUpdate(id, userData);
    if (companyData) {
      await this.companyModel.findOneAndUpdate({ user_id: id }, companyData);
    }
    return { message: 'User updated successfully' };
  }

  async deleteUser(ids: string[]) {
    const res = await this.userModel.deleteMany({ _id: { $in: ids } });
    await this.companyModel.deleteMany({ user_id: { $in: ids } });
    if (res.deletedCount < 1) {
      throw new BadRequestException('User not deleted');
    }
    return { message: 'User deleted successfully' };
  }

  async getCurrentUser(email: string) {
    const [user] = await this.userModel.aggregate([
      { $match: { email } },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: 'user_id',
          as: 'companyData',
        },
      },
      { $project: { password: 0 } },
    ]);
    return user;
  }

  async login(dto: LoginDto,res) {
    const { email, password } = dto;
    const [user] = await this.userModel.aggregate([
      {$match:{email}},
      {
        $lookup:{
          from:'payments',
          localField:'_id',
          foreignField:'user_id',
          as:'paymentData'
        }
       },{
        $unwind:'$paymentData'
       },
       {
        $project:{
           f_name: 1,
            l_name: 1,
            email:1,
            password:1,
            status: 1,
           'paymentData._id':1,
           'paymentData.paymentMode':1
        }
       }
    ]);
  
    // const user = await this.userModel.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }

    const token = this.jwtService.sign({ id: user._id, email: user.email });

    delete user.password
    if(user.status === 'approved'){
      return res.status(HttpStatus.OK).send( { user: user ,token,massage: "Login successfully"})
    }else{
    
    return res.status(HttpStatus.OK).send( { user: user ,massage: "Account is not varified yet"})
    }
   
  }

  async createPaymentIntent(body: {
    amount: number;
    currency?: string;
    customer_email?: string;
  }) {
    const { amount, currency = 'chf', customer_email } = body;

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        receipt_email: customer_email,
        payment_method_types: ['card', 'twint'],
      });

      return { clientSecret: paymentIntent.client_secret };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async checkEmailExist(body: CheckUserExistsDto,res) {
    const { email } = body;
try{
   const userExists = await this.userModel.findOne({ email });
    if (userExists) {
     
      return res.status(HttpStatus.BAD_REQUEST).send({message:'User already exists'})
    }else{
      return res.status(HttpStatus.OK).send({user:userExists})
    }
}catch(error:any){
throw new InternalServerErrorException(error.message);
}
 }
}



   
  
