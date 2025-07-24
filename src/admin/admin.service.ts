import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Address, AddressDocument } from 'src/schemas/address.schema';
import { Guest, GuestDocument } from 'src/schemas/guest.schema';
import { Report, ReportDocument } from 'src/schemas/report.schema';
import { User, UserDocument } from 'src/schemas/user.schema';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { deleteData } from 'src/common/common';
import { Company, CompanyDocument } from 'src/schemas/company.schema';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { Payment, PaymentDocument } from 'src/schemas/payment.schema';
import * as bcrypt from 'bcrypt';

import { writeFile, mkdir } from 'fs/promises';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';

@Injectable()
export class AdminService {
     private transporter: nodemailer.Transporter;
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
        @InjectModel(Guest.name) private guestModel: Model<GuestDocument>,
        @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
        @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
        @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
        private jwtService: JwtService
    ) {
         this.transporter = nodemailer.createTransport({
            // service: 'gmail', // or use `host`, `port`, `auth` for custom SMTP
            host:'mail.infomaniak.com',
            port:465,

            auth: {
                 user: 'app@b2binfo.ch',
                pass: '9g319#/FcALe-S_',
            },
        });
      }

    async updateUserStatus(body,res){
        try{
            const { status, id } = body;
            const data =  await this.updateStatus(status, id, this.userModel);
            const templatePath = status === "approved" ? path.join(__dirname, '..','..','src','mail','templates','approveUserTemplate.hbs'): path.join(__dirname,'..','..','src', 'mail','templates','disApproveUserTemplate.hbs');
            const source = fs.readFileSync(templatePath, 'utf-8');
            const template = handlebars.compile(source);
            if(data){
            const templateData=template({
                    name: data.f_name + " " + data.l_name,
                    email:data.email
                })
          
            const subject="Regarding account approve"
            await this.sendMail(data.email,subject,templateData)
             return res.status(HttpStatus.OK).send({ message: "User updated successfully" })
            }else{
            return res.status(HttpStatus.OK).send({ message: "User not updated" })
            }
           
        }catch(err:any){
            throw new InternalServerErrorException(err.message);
        }
       
     }

    async updateReportStatus(body,res){
        const { status, id } = body;
        try{
            const data = await this.updateStatus(status,id,this.reportModel);
          
            const [guestData] = await this.guestModel.aggregate([
                {
                    $match:{
                        _id:data.guest_id
                    }
                },
                { 
                    $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'userData',
                    },
                },
                {
                     $unwind:'$userData'
                }
            ]);
        
            const templatePath = status === "approved" ? path.join(__dirname, '..','..','src','mail','templates','approveReportTemplate.hbs'): path.join(__dirname,'..','..','src', 'mail','templates','disApproveReportTemplate.hbs');
            const source = fs.readFileSync(templatePath, 'utf-8');
            const template = handlebars.compile(source);
            if(data && guestData){
            const templateData = template({
                    name: guestData?.userData.f_name + " " + guestData.userData.l_name,
                 
                })
          
            const subject="Regarding report approve"
            await this.sendMail(guestData.userData.email,subject,templateData)
               return res.status(HttpStatus.OK).send({ message: "Report updated successfully" });
            }else{
              return res.status(HttpStatus.OK).send({ message: "Report not updated" });
            }
        }catch(err:any){
            throw new InternalServerErrorException(err.message);
        }
    }

     async updateStatus(status,id,model){
        try{
            const updateData= await model.findByIdAndUpdate(id,{status},{new:true})
            if(updateData){
                return updateData
            }else{
                return updateData
            }
         }catch(err:any){
            throw new InternalServerErrorException(err.message);
        }
      
     }

 async sendMail( to: string, subject: string,htmlContent:any): Promise<void>{
    const from = "app@b2binfo.ch"
    const mailOptions: nodemailer.SendMailOptions = {
      from,
      to,
      subject,
      html: htmlContent,
    };

   const sendEmail= await this.transporter.sendMail(mailOptions);
   console.log("sendEmail",sendEmail)
 }


       async getAllUsers(req,res){
        try{
            const {page = "1",limit="10",sorting} = req.query
            const comanyLookup = {
                $lookup: {
                from: 'companies',
                localField: '_id',
                foreignField: 'user_id',
                as: 'companyData',
                },
            }
            const paymentsookup = {
                $lookup: {
                    from: 'payments',
                    localField: '_id',
                    foreignField: 'user_id',
                    as: 'paymentData',
                },
            }
       
           const {data,totalCount,totalPages} = await this.getAllDataWithPagination(page,limit,this.userModel,comanyLookup,paymentsookup,false,false,false,false)
           data.map((user)=>{
            return delete user.password 
           })
            return res.status(HttpStatus.OK).send({data,totalCount,totalPages,page,limit})
         }catch(err:any){
            throw new InternalServerErrorException(err.message);
        }
      
     }

 async getAllGuests(req,res){
        try{
            const {page = "1",limit="10",sorting} = req.query
            const addressLookup = {
                $lookup: {
                    from: 'addresses',
                    localField: '_id',
                    foreignField: 'guest_id',
                    as: 'addressData',
                },
            }
            const reportsLookup = {
                $lookup: {
                    from: 'reports',
                    localField: '_id',
                    foreignField: 'guest_id',
                    as: 'reportData',
                },
            }

           const userLookup =  {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'userData',
                },
            }
            const unwindUserData=false
       

           const {data,totalCount,totalPages} = await this.getAllDataWithPagination(page,limit, this.guestModel, addressLookup,reportsLookup,userLookup, unwindUserData,false,false)
            return res.status(HttpStatus.OK).send({data,totalCount,totalPages,page,limit})
         }catch(err:any){
            throw new InternalServerErrorException(err.message);
        }
      
     }
     
     async getAllReports(req,res){
        try{
            const {page = "1",limit="10",sorting} = req.query
           
            const guestLookup = {
                $lookup: {
                    from: 'guests',
                    localField: 'guest_id',
                    foreignField: '_id',
                    as: 'guestData',
                },
            }
             const unwindGuestData={
                $unwind:'$guestData'
            }
            const addressLookup = {
                $lookup: {
                    from: 'addresses',
                    localField: 'guestData._id',
                    foreignField: 'guest_id',
                    as: 'addressData',
                },
            }
              const unwindAddressData={
                $unwind:'$addressData'
            }
           const userLookup =  {
                $lookup: {
                    from: 'users',
                    localField: 'guestData.user_id',
                    foreignField: '_id',
                    as: 'userData',
                },
            }
            const unwindUserData={
                $unwind:'$userData'
            }
       

           const {data,totalCount,totalPages} = await this.getAllDataWithPagination(page,limit, this.reportModel,guestLookup, addressLookup,userLookup, unwindUserData,unwindGuestData,unwindAddressData)
           return res.status(HttpStatus.OK).send({data,totalCount,totalPages,page,limit})
         }catch(err:any){
            throw new InternalServerErrorException(err.message);
        }
      
     }
     

 async getAllDataWithPagination(page,limit,model,lookup,paymentLookup,userLookup,unwindUser,unwindLookup,unwindPaymentLookup){
        try{
            const pageSize = +limit
            const skip = (page - 1) * limit;
            const pipeline = [
                {
                $facet: {
                    paginatedResults: [
                        { $skip: skip},
                        { $limit: pageSize }
                    ],
                    totalCount: [
                        { $count: 'total' }
                    ]
                }
                },
                {
                $project: {
                    paginatedResults: 1,
                    total: { $arrayElemAt: ['$totalCount.total', 0] }
                }
                }
            ];
            
            if(unwindUser){
                pipeline.unshift(unwindUser) 
            }
             if(userLookup){
                pipeline.unshift(userLookup) 
            }
             if(unwindPaymentLookup){
                pipeline.unshift(unwindPaymentLookup) 
            }
              if(paymentLookup){
                pipeline.unshift(paymentLookup) 
            }
            
             if(unwindLookup){
                pipeline.unshift(unwindLookup) 
            }
              if(lookup){
                pipeline.unshift(lookup) 
            }
            
            const [result] = await model.aggregate(pipeline);
            const data = result.paginatedResults;
            const totalCount = result.total ? result.total : 0;
            const totalPages = Math.ceil(totalCount / limit);
            return{ data, totalCount, totalPages }
         }catch(err:any){
             throw new InternalServerErrorException(err.message);
        }
    }
    
    async deleteUser({ids}) {
        try{
            const res = await deleteData(ids,this.userModel)
            await this.companyModel.deleteMany({ user_id: { $in: ids.map((id)=> new Types.ObjectId(id)) } });
            if (!res) {
            throw new BadRequestException('User not deleted');
            }
            return { message: 'User deleted successfully' };
        }catch(err:any){
             throw new InternalServerErrorException(err.message);
        }
    }
    
    async deleteGuest({ids}) {
        try{
            const res = await deleteData(ids,this.guestModel);
            if (!res) {
            throw new BadRequestException('Guest not deleted');
            }
             await this.addressModel.deleteMany({ guest_id: { $in: ids.map((id)=> new Types.ObjectId(id)) } });
             await this.reportModel.deleteMany({ guest_id: { $in: ids.map((id)=> new Types.ObjectId(id)) } });
            return { message: 'Guest deleted successfully' };
        }catch(err:any){
             throw new InternalServerErrorException(err.message);
        }
    }

    async deleteReport({ids}) {
        try{
            const res = await deleteData(ids,this.reportModel);
            if (!res) {
            throw new BadRequestException('Report not deleted');
            }
            return { message: 'Report deleted successfully' };
        }catch(err:any){
             throw new InternalServerErrorException(err.message);
        }
    }

    
    async createUser(dto: CreateUserDto,res) {
        const { email, password, amount, currency = 'chf', paymentMode=null,paymentId=null, ...companyInfo } = dto;
        try{
           const userExists = await this.userModel.findOne({ email });
        if (userExists) {
          //throw new BadRequestException('User already exists');
          return res.status(HttpStatus.BAD_REQUEST).send({message:"User already exists"})
    
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.userModel.create({ ...dto, password: hashedPassword });
          
        await this.companyModel.create({ ...companyInfo, user_id: user._id });
    
        const price = amount / 100;
        await this.paymentModel.create({
          user_id: user._id,
          price,
          currency,
          paymentId,
          current_date: new Date(),
          paymentMode: paymentMode
        });
        const { password: _, ...userWithoutPassword } = user.toObject(); 
        //const token = this.jwtService.sign({ id: user._id, email: user.email });
    
        // return { message: 'User created successfully', user: userWithoutPassword ,paymentMode: paymentMode};
         return res.status(HttpStatus.CREATED).send({message: 'User created successfully', user: userWithoutPassword ,paymentMode: paymentMode})
    
        }catch(err){
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({message:err.message})
        }
      }

        async createGuest(
          // files: Express.Multer.File[],
          body: any,
          user_id: any,
          res,
        ) {
          try {
            const {
              first_name,
              last_name,
              company_name,
              nationality,
              document_type,
              document_number,
              telephone,
              email,
              check_in,
              check_out,
              message,
              ...addressInfo
            } = body;
            // if (files.length === 0) {
            //   throw new BadRequestException('Please select atleast one file');
            // }
      
            // const folderPath = path.join(__dirname, '..', '..', 'public', 'uploads');
            // if (!fs.existsSync(folderPath)) {
            //   await mkdir(path.dirname(folderPath), { recursive: true });
            // }
           
            // const fileData: string[] = [];
      
            // for (const file of files) {
            //   const ext = file.originalname.split('.').pop();
            //   const filename = path.parse(file.originalname).name;
            //   const filePath =
            //     folderPath + '/' + filename + '-' + Date.now() + '.' + ext;
      
            //   await writeFile(filePath, file.buffer);
            //   const fileBaseName = await path.basename(filePath);
            //   fileData.push(fileBaseName);
            // }
      
            const data = {
              first_name,
              last_name,
              company_name,
              nationality,
              document_type,
              document_number,
              telephone,
              email,
              // check_in,
              // check_out,
              // message,
              // images: fileData,
              user_id: new Types.ObjectId(user_id),
            };
            let guestData:any
            const userExists = await this.guestModel.findOne({ email });
            if (userExists) {
              // throw new BadRequestException('Guest already exists');
             guestData=userExists
            }else{
              guestData = await this.guestModel.create(data);
            }
      
            
            // const reportData = {
            //   check_in,
            //   check_out,
            //   message,
            //   images: fileData,
            //   guest_id: guestData._id,
            // };
           
            // await this.reportModel.create(reportData);
            if(!userExists){
               const addressData = {
              ...addressInfo,
              guest_id: guestData._id,
            };
            await this.addressModel.create(addressData);
            }
            
            // return {message:"Guest ragister successfully"}
            return res
              .status(HttpStatus.CREATED)
              .send({ message: 'Guest ragister successfully' });
          } catch (error) {
            throw new InternalServerErrorException(error.message);
          }
        }



        async createReport(
          files: Express.Multer.File[],
          body: any,
      
          res,
        ) {
          try {
            const {
             guestId,
              check_in,
              check_out,
              message,
              // ...addressInfo
            } = body;
            if (files.length === 0) {
              throw new BadRequestException('Please select atleast one file');
            }
      
            const folderPath = path.join(__dirname, '..', '..', 'public', 'uploads');
            if (!fs.existsSync(folderPath)) {
              await mkdir(path.dirname(folderPath), { recursive: true });
            }
           
            const fileData: string[] = [];
      
            for (const file of files) {
              const ext = file.originalname.split('.').pop();
              const filename = path.parse(file.originalname).name;
              const filePath =
                folderPath + '/' + filename + '-' + Date.now() + '.' + ext;
      
              await writeFile(filePath, file.buffer);
              const fileBaseName = await path.basename(filePath);
              fileData.push(fileBaseName);
            }
            
            const reportData = {
              check_in,
              check_out,
              message,
              images: fileData,
              guest_id: new Types.ObjectId(guestId),
            };
           
            await this.reportModel.create(reportData);
           
            return res
              .status(HttpStatus.CREATED)
              .send({ message: 'Report ragister successfully' });
          } catch (error) {
            throw new InternalServerErrorException(error.message);
          }
        }

         async updateUser(id: string, dto: UpdateUserDto,res) {
            const { f_name, l_name, amount, currency = 'chf', ...companyInfo } = dto;
            console.log("companyInfo",companyInfo,"dto",dto)
           try {

             const user= await this.userModel.findByIdAndUpdate(id, {f_name,l_name},{new:true});
             await this.companyModel.findOneAndUpdate({user_id: new Types.ObjectId(id)}, {...companyInfo},{new:true});
       
             const price = amount / 100;
              await this.paymentModel.findOneAndUpdate({user_id:new Types.ObjectId(id)}, {price,currency},{new:true});
            
             return res.status(HttpStatus.CREATED).send({ message: 'User updated successfully' })
       
           }catch(err){
             return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message })
           }
         } 
    
}
