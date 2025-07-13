import { Module } from '@nestjs/common';
import { GuestController } from './guest.controller';
import { GuestService } from './guest.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Guest, GuestSchema } from 'src/schemas/guest.schema';
import { Address, AddressSchema } from 'src/schemas/address.schema';
import { JwtModule } from '@nestjs/jwt';
import { Report, ReportSchema } from 'src/schemas/report.schema';

@Module({
  imports: [
      MongooseModule.forFeature([
        { name: Guest.name, schema: GuestSchema },
        { name: Address.name, schema: AddressSchema },
        { name: Report.name, schema: ReportSchema }
       
      ]),
      JwtModule.register({
        secret: process.env.JWT_SECRET || 'fghjghgjhjghdsxzdxzdkhjk', // ✅ Fix is here
        signOptions: { expiresIn: '1d' },
      }),
    ],
  controllers: [GuestController],
  providers: [GuestService]
})
export class GuestModule {}
