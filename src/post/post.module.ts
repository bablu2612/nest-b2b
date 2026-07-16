import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from 'src/schemas/post.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
   imports: [
        MongooseModule.forFeature([
          { name: Post.name, schema: PostSchema },
         
        ]),
        JwtModule.register({
          secret: process.env.JWT_SECRET || 'fghjghgjhjghdsxzdxzdkhjk', // ✅ Fix is here
          signOptions: { expiresIn: '1d' },
        }),
        
      ],
   
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
