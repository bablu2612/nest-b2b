import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post {
  @Prop() post_type: string;
  @Prop({type:Types.ObjectId,ref:'Category'}) category_id: Types.ObjectId;
  @Prop({unique: true}) title: string;
  @Prop() description: string;
  @Prop() currency: string;
  
  @Prop() price: string;

  @Prop() quantity: number;
  @Prop() additional_info: string;
  @Prop() photos:  Array<string>;
  @Prop({type:Types.ObjectId,ref:'User'}) user_id: Types.ObjectId;
}
 

export type PostDocument = Post & Document;
export const PostSchema = SchemaFactory.createForClass(Post);


