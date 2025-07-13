import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user.schema';
import { Company, CompanySchema } from 'src/schemas/company.schema';
import { Payment, PaymentSchema } from 'src/schemas/payment.schema';
import { JwtModule } from '@nestjs/jwt';
import { Guest, GuestSchema } from 'src/schemas/guest.schema';
import { Address, AddressSchema } from 'src/schemas/address.schema';
import { Report, ReportSchema } from 'src/schemas/report.schema';

@Module({
   imports: [
      MongooseModule.forFeature([
        { name: User.name, schema: UserSchema },
        { name: Company.name, schema: CompanySchema },
        { name: Payment.name, schema: PaymentSchema },
        { name: Guest.name, schema: GuestSchema },
        { name: Address.name, schema: AddressSchema },
        { name: Report.name, schema: ReportSchema }
      ]),
      JwtModule.register({
        secret: process.env.JWT_SECRET || 'fghjghgjhjghdsxzdxzdkhjk', // ✅ Fix is here
        signOptions: { expiresIn: '1d' },
      }),
    ],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
