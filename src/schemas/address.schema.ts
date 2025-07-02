import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Address {
  @Prop() street_name: string;
  @Prop() building_no: string;
  @Prop() appartment_no: string;
  @Prop() zip_code: string;
  @Prop() city: string;
  @Prop() country: string;

  @Prop({type:Types.ObjectId,ref:'Guest'}) guest_id: Types.ObjectId;
}
 

export type AddressDocument = Address & Document;
export const AddressSchema = SchemaFactory.createForClass(Address);


