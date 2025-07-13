import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Report {
  
  @Prop() check_in: string;
  @Prop() check_out: string;
  @Prop() message: string;
  @Prop() images: Array<string>;
  @Prop({type:Types.ObjectId,ref:'Guest'}) guest_id: Types.ObjectId;
}
 

export type ReportDocument = Report & Document;
export const ReportSchema = SchemaFactory.createForClass(Report);




