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
import * as nodemailer from 'nodemailer';
import { User, UserDocument } from '../schemas/user.schema';
import { Company, CompanyDocument } from '../schemas/company.schema';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from '../user/dto/login.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { CheckUserExistsDto } from './dto/check-user-exist.dto';
import { MailService } from 'src/mail/mail.service';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { deleteData } from 'src/common/common';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // apiVersion: '2022-11-15',
});

@Injectable()
export class UserService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly mailService: MailService,

    private jwtService: JwtService,
  ) {
    this.transporter = nodemailer.createTransport({
      // service: 'gmail', // or use `host`, `port`, `auth` for custom SMTP
      host: 'mail.infomaniak.com',
      port: 465,

      auth: {
        user: process.env.FROM_EMAIL,
        pass: process.env.FROM_PASS,
      },
    })
  }


  async createUser(dto: CreateUserDto, res) {
    const { email, password, amount, currency = 'chf', paymentMode, paymentId, ...companyInfo } = dto;
    try {
      const userExists = await this.userModel.findOne({ email });
      if (userExists) {
        //throw new BadRequestException('User already exists');
        return res.status(HttpStatus.BAD_REQUEST).send({ message: "User already exists" })

      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.userModel.create({ ...dto, password: hashedPassword });

      await this.companyModel.create({ ...companyInfo, user_id: user._id });
      const expiry_date=new Date()
      expiry_date.setFullYear(expiry_date.getFullYear() + 1)
      const price = amount / 100;
      await this.paymentModel.create({
        user_id: user._id,
        price,
        currency,
        paymentId,
        current_date: new Date(),
        expiry_date: expiry_date,
        paymentMode: paymentMode
      });
      const { password: _, ...userWithoutPassword } = user.toObject();
      //const token = this.jwtService.sign({ id: user._id, email: user.email });

      // return { message: 'User created successfully', user: userWithoutPassword ,paymentMode: paymentMode};
      return res.status(HttpStatus.CREATED).send({ message: 'User created successfully', user: userWithoutPassword, paymentMode: paymentMode })

    } catch (err) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message })
    }

  }

  async getAllUsers(res) {
    try {
      const users = await this.userModel.aggregate([
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
      
      return res.status(HttpStatus.OK).send({ users })
    } catch (err) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message })
    }

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

  async updateUser(id: string, dto: UpdateUserDto,res) {
     const { f_name, l_name, amount, currency = 'chf',password, ...companyInfo } = dto;
     console.log("companyInfo",companyInfo,"dto",dto)
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const updateData:{ [key: string]: any } = {
          f_name,
          l_name,
        };

        if (password) {
          updateData.password = hashedPassword; 
        }
       
      const user= await this.userModel.findByIdAndUpdate(id, updateData,{new:true});
      await this.companyModel.findOneAndUpdate({user_id: new Types.ObjectId(id)}, {...companyInfo},{new:true});

      const price = amount / 100;
       await this.paymentModel.findOneAndUpdate({user_id:new Types.ObjectId(id)}, {price,currency},{new:true});
     
      return res.status(HttpStatus.CREATED).send({ message: 'User updated successfully' })

    }catch(err){
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message })
    }
  }

  async deleteUser({ids}) {
    try {
      const res = await deleteData(ids, this.userModel)
      await this.companyModel.deleteMany({ user_id: { $in: ids.map((id)=> new Types.ObjectId(id)) } });
      if (!res) {
        throw new BadRequestException('User not deleted');
      }
      return { message: 'User deleted successfully' };
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
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

  async login(dto: LoginDto, res) {
    const { email, password } = dto;
    const [user] = await this.userModel.aggregate([
      { $match: { email } },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'user_id',
          as: 'paymentData'
        }
      }, {
        $unwind: '$paymentData'
      },
      {
        $project: {
          f_name: 1,
          l_name: 1,
          email: 1,
          password: 1,
          status: 1,
          'paymentData._id': 1,
          'paymentData.paymentMode': 1
        }
      }
    ]);

    // const user = await this.userModel.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }

    const token = this.jwtService.sign({ id: user._id, email: user.email });

    delete user.password
    if (user.status === 'approved') {
      return res.status(HttpStatus.OK).send({ user: user, token, massage: "Login successfully" })
    } else {

      return res.status(HttpStatus.OK).send({ user: user, massage: "Account is not varified yet" })
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

  async checkEmailExist(body: CheckUserExistsDto, res) {
    const { email } = body;
    try {
      const userExists = await this.userModel.findOne({ email });
      if (userExists) {

        return res.status(HttpStatus.BAD_REQUEST).send({ message: 'User already exists' })
      } else {
        return res.status(HttpStatus.OK).send({ user: userExists })
      }
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async updatePassword(email, body, res) {
    const { password, new_password } = body;
    try {
      const user = await this.userModel.findOne({ email });
      if (user) {
        const matchPassword = await bcrypt.compare(password, user.password)
        if (matchPassword) {
          const hashedPassword = await bcrypt.hash(new_password, 10);
          await this.userModel.findOneAndUpdate({ email }, { password: hashedPassword }, { new: true });
          return res.status(HttpStatus.OK).send({ message: 'Password updated successfully' })
        } else {
          return res.status(HttpStatus.BAD_REQUEST).send({ message: 'Password does not match to old password' })
        }
      } else {
        return res.status(HttpStatus.BAD_REQUEST).send({ message: 'User does not exists' })
      }
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: error.message })
    }
  }

  async forgotPassword(origin, body, res) {
    const { email } = body;
    console.log(origin);
    try {
      const userExists = await this.userModel.findOne({ email });
      if (!userExists) {
        return res.status(HttpStatus.BAD_REQUEST).send({ message: 'User does not exists' });
      }

      const resetToken = this.jwtService.sign({ id: userExists._id, email: userExists.email }, { expiresIn: '24h' });
      // await this.userModel.findOneAndUpdate({email},{resetToken,resetTime: new Date(Date.now() + 15 * 60000)}). //15 min
      await this.userModel.findOneAndUpdate({ email }, { resetToken, resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000) })  //24 h
      const resetLink = `${origin}/reset-password?token=${resetToken}`;
      console.log("resetLink", resetLink)
      const templatePath = path.join(__dirname, '..', '..', 'src', 'mail', 'templates', 'resetTemplate.hbs')
      const source = fs.readFileSync(templatePath, 'utf-8');
      const template = handlebars.compile(source);

      const templateData = template({
        resetLink: resetLink
      });

      await this.mailService.send({
        to: email,
        subject: 'Reset Password',
        html: templateData,
      });
      return res.status(HttpStatus.OK).send({ message: "Password reset link sent successfully" })

    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: error.message })
    }
  }



  async verifyToken(req, res) {
    const { token } = req.query;
    try {
      if (!token) {
        return res.status(HttpStatus.BAD_REQUEST).send({ message: "Token does not exist" });
      }

      const verifyToken = this.jwtService.verify(token);

      if (verifyToken) {
        const detail = this.jwtService.decode(token);
        console.log("detail", detail)
        const { email } = detail;
        const user = await this.userModel.findOne({ email })
        const currentDate = Date.now()
        if (user?.resetToken !== token) {
          return res.status(HttpStatus.BAD_REQUEST).send({ message: "Invalid or expired token" })

        }
        if (user && Date.now() > user.resetTime.getTime()) {
          return res.status(HttpStatus.BAD_REQUEST).send({ message: "token expired" })
        }
        // await this.userModel.findOneAndUpdate({email},{resetStatus:true})

        //        user.resetPasswordToken = null;
        // user.resetPasswordExpires = null;
        //       }


        return res.status(HttpStatus.OK).send({ message: "token verified successfully" })

      } else {
        return res.status(HttpStatus.BAD_REQUEST).send({ message: "Invalid or expired token" })
      }
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: error.message })
    }
  }


  async resetPassword(body, res) {
    const { token, password } = body;
    try {

      if (!token) {
        return res.status(HttpStatus.BAD_REQUEST).send({ message: "Token does not exist" })
      }
      if (!password) {
        return res.status(HttpStatus.BAD_REQUEST).send({ message: "Password does not exist" })
      }
      const verifyToken = this.jwtService.verify(token);

      if (verifyToken) {
        const detail = this.jwtService.decode(token);
        console.log("detail", detail)
        const { email } = detail;
        const user = await this.userModel.findOne({ email })
        const currentDate = Date.now()
        if (user?.resetToken !== token) {
          return res.status(HttpStatus.BAD_REQUEST).send({ message: "Invalid or expired token" })

        }
        if (user && Date.now() > user.resetTime.getTime()) {
          return res.status(HttpStatus.BAD_REQUEST).send({ message: "token expired" })
        }
        const hashedPassword = await bcrypt.hash(password, 10);


        await this.userModel.findOneAndUpdate({ email }, { password: hashedPassword, resetToken: null, resetTime: null })

        return res.status(HttpStatus.OK).send({ message: "Password updated successfully" })

      }
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: error.message })
    }
  }



}





