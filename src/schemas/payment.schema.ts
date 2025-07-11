import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop()
  current_date: Date;

  @Prop()
  price: string;

  @Prop()
  currency: string;

  @Prop()
  paymentId: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user_id: Types.ObjectId;
  
   @Prop()
  paymentMode: string;

  
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
