import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import cron from 'node-cron';
import { MailService } from './mail/mail.service';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
   const userModel = app.get<Model<User>>(getModelToken(User.name));
   const mailService = app.get(MailService);
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/',
  });
  // app.use(bodyParser.json({ limit: '50mb' }));
  // app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  app.enableCors({
    origin: '*', // Or use: ['http://localhost:3000'] for specific origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  // cron.schedule('1-5 * * * *', async() => {           //for  every 1 minute from 1 to 5 
  // cron.schedule('* * * * * *', async() => {          //for per second

  cron.schedule('0 0 * * *', async() => {
  console.log('Running daily task at 12 AM...');
   await sendSubscriptionMail();
})

   const sendSubscriptionMail = async()=> {
      try {
        const users = await userModel.aggregate([
          {
            $lookup: {
              from: 'companies',
              localField: '_id',
              foreignField: 'user_id',
              as: 'companyData',
            },
          },
          {
            $lookup: {
              from: 'payments',
              localField: '_id',
              foreignField: 'user_id',
              as: 'paymentData',
            },
          },
          { $project: { password: 0 } },
        ]);
        const today = new Date()
        const tenDaysAgo = new Date()
        tenDaysAgo.setDate(today.getDate() - 10)

        const userEmails = users.filter((value)=>{
          const paymentExpDateStr = value.paymentData[0]?.expiry_date;
            if (!paymentExpDateStr) return false;
            const paymentExpDate = new Date(paymentExpDateStr)
            // console.log("users",value.paymentData,paymentExpDate)
             console.log("users",paymentExpDate)
            return paymentExpDate.toDateString() === tenDaysAgo.toDateString();
        })
        .map((user)=>user.email)
        
          console.log('Emails with payment exactly 10 days ago:', userEmails);


           const templatePath = path.join(__dirname, '..', 'src', 'mail', 'templates', 'subscriptionReminderTemplate.hbs');
                const source = fs.readFileSync(templatePath, 'utf-8');
                const template = handlebars.compile(source);
          
                const templateData = template({
                  // email:email
                });
          

             for(const email of userEmails){
                await mailService.send({
                  to: email,
                  subject: 'Renewal subscription',
                  html: templateData,
                });
             }
                
          return {message:"mail sent success"}

      } catch (err) {
         console.log('err for subscription mail:', err.message);
      }
  
    }
   
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
