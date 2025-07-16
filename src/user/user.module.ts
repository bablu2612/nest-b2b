import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from '../schemas/user.schema';
import { Company, CompanySchema } from '../schemas/company.schema';
import { Payment, PaymentSchema } from '../schemas/payment.schema';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fghjghgjhjghdsxzdxzdkhjk', // ✅ Fix is here
      signOptions: { expiresIn: '1d' },
    }),
    MailModule
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
