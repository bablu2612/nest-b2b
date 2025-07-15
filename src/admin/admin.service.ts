import { HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Address, AddressDocument } from 'src/schemas/address.schema';
import { Guest, GuestDocument } from 'src/schemas/guest.schema';
import { Report, ReportDocument } from 'src/schemas/report.schema';
import { User, UserDocument } from 'src/schemas/user.schema';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

@Injectable()
export class AdminService {
     private transporter: nodemailer.Transporter;
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
        @InjectModel(Guest.name) private guestModel: Model<GuestDocument>,
        @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
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
            console.log("updateData",updateData)
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
            const unwindUserData={
                $unwind:'$userData'
            }
       

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
    

    
}
