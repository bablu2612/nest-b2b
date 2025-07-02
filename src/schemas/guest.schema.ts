import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Guest {
  @Prop() first_name: string;
  @Prop() last_name: string;
  @Prop() company_name: string;
  @Prop() nationality: string;
  @Prop() document_type: string;
  @Prop() document_number: string;
  @Prop() telephone: string;
  @Prop({ unique: true }) email: string;
  @Prop() check_in: string;
  @Prop() check_out: string;
  @Prop() message: string;
  @Prop() images: Array<string>;
  @Prop({type:Types.ObjectId,ref:'User'}) user_id: Types.ObjectId;
}
 

export type GuestDocument = Guest & Document;
export const GuestSchema = SchemaFactory.createForClass(Guest);




