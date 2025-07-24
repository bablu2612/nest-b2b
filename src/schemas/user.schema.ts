import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop() f_name: string;
  @Prop() l_name: string;
  @Prop({ unique: true }) email: string;
  @Prop() password: string;
  @Prop({ default: "pending" }) status: string;
  @Prop({ default: "user" }) role: string;
  @Prop() resetToken: string;
  // @Prop({ default: false }) resetStatus: Boolean;
  @Prop() resetTime: Date;
  
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
