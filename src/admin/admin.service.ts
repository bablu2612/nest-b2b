import { HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Address, AddressDocument } from 'src/schemas/address.schema';
import { Guest, GuestDocument } from 'src/schemas/guest.schema';
import { Report, ReportDocument } from 'src/schemas/report.schema';
import { User, UserDocument } from 'src/schemas/user.schema';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
        @InjectModel(Guest.name) private guestModel: Model<GuestDocument>,
        @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
        
        private jwtService: JwtService,
      ) {}

    async updateUserStatus(body,res){
        try{
            const { status, id } = body;
            await this.updateStatus(status, id, this.userModel);
            return res.status(HttpStatus.OK).send({ message: "User updated successfully" })
        }catch(err:any){
            throw new InternalServerErrorException(err.message);
        }
       
     }

    async updateReportStatus(body,res){
        const { status, id } = body;
        try{
            await this.updateStatus(status,id,this.reportModel);
            return res.status(HttpStatus.OK).send({ message: "Report updated successfully" });
        }catch(err:any){
            throw new InternalServerErrorException(err.message);
        }
    }

     async updateStatus(status,id,model){
        try{
            const updateData= await model.findByIdAndUpdate(id,{status},{new:true})
            console.log("updateData",updateData)
            if(updateData){
                return true
            }else{
                return false
            }
         }catch(err:any){
            throw new InternalServerErrorException(err.message);
        }
      
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
       
           const {data,totalCount,totalPages} = await this.getAllDataWithPagination(page,limit,this.userModel,comanyLookup,paymentsookup,false,false)
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
       

           const {data,totalCount,totalPages} = await this.getAllDataWithPagination(page,limit, this.guestModel, addressLookup,reportsLookup,userLookup, unwindUserData)
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
       

           //const {data,totalCount,totalPages} = await this.getAllDataWithPagination(page,limit, this.reportModel, addressLookup,reportsLookup,userLookup, unwindUserData)
           // return res.status(HttpStatus.OK).send({data,totalCount,totalPages,page,limit})
         }catch(err:any){
            throw new InternalServerErrorException(err.message);
        }
      
     }
     

 async getAllDataWithPagination(page,limit,model,lookup,paymentLookup,userLookup,unwindUser){
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
             if(paymentLookup){
                pipeline.unshift(paymentLookup) 
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
