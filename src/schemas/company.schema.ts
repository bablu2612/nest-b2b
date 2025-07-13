import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  @Prop()
  company_name: string;

  @Prop()
  street_name: string;

  @Prop()
  building_no: string;

  @Prop()
  room_no: string;

  @Prop()
  zip_code: string;

  @Prop()
  city: string;

  @Prop()
  country: string;

  @Prop()
  stars: number;

  @Prop()
  is_part_of_association: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user_id: Types.ObjectId;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
