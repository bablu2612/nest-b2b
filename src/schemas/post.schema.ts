import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PostStatus } from 'src/post/enums/post-status.enum';
import { PostType } from 'src/post/enums/post-type.enum';

@Schema({ timestamps: true })
export class Post {
  @Prop({type: String, enum: PostType,required: true}) post_type: string;
  @Prop({type:Types.ObjectId,ref:'Category'}) category_id: Types.ObjectId;
  @Prop({unique: true}) title: string;
  @Prop() description: string;
  @Prop() country: string;
  @Prop() address: string;
  @Prop() lat: string;
  @Prop() long: string;
  
  @Prop() currency: string;
  
  @Prop() price: string;
  @Prop() weeklyPrice: string;
  @Prop() monthlyPrice: string;

  @Prop() quantity: number;
  @Prop() additional_info: string;
  @Prop() photos:  Array<string>;
  @Prop({type:Types.ObjectId,ref:'User'}) user_id: Types.ObjectId;

  @Prop({type: String, enum: PostStatus,required: true,default: "online"}) status: string;
  @Prop() condition: string;
  @Prop({default: 0}) views: number;
  // @Prop() product_id: string;
   
  
}
 

export type PostDocument = Post & Document;
export const PostSchema = SchemaFactory.createForClass(Post);


