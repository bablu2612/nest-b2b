// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module'; // ✅ If you have it
import { GuestModule } from './guest/guest.module';
import { AdminModule } from './admin/admin.module';
import { CategoryService } from './category/category.service';
import { CategoryModule } from './category/category.module';
import { PostModule } from './post/post.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      
     }),
    // MongooseModule.forRoot('mongodb://localhost:27017/binfo'),
    MongooseModule.forRoot('mongodb+srv://bk147411:XBVbf4QzcpqJA7JZ@movies-demo.ken32.mongodb.net/b2binfo?retryWrites=true&w=majority&appName=movies-demo'),
    CategoryModule,

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('DB_URL', { infer: true }),
      }),
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),

    UserModule,
    AuthModule,
    GuestModule,
    AdminModule,
    CategoryModule,
    PostModule, // ✅ if you're managing auth separately
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
