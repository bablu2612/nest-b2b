import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { error } from 'console';

import { writeFile, mkdir } from 'fs/promises';
import * as path from 'path';
import * as fs from 'fs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Guest, GuestDocument } from 'src/schemas/guest.schema';
import { Address, AddressDocument } from 'src/schemas/address.schema';
@Injectable()
export class GuestService {
   constructor(
      @InjectModel(Guest.name) private guestModel: Model<GuestDocument>,
      @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
     
    ) {}
   
  async createGuest (files:Express.Multer.File[],body:any,user_id:any,res){
 
    try{  
      const {first_name,last_name,company_name,nationality,document_type,document_number,telephone,email,check_in,check_out,message,...addressInfo}=body
      if(files.length === 0){
        throw new BadRequestException('Please select atleast one file');
      }

      const folderPath = path.join(__dirname, '..', '..', 'public','uploads');
    if (!fs.existsSync(folderPath)) {
          await mkdir(path.dirname(folderPath), { recursive: true });
        } 
    const userExists = await this.guestModel.findOne({ email });
    if (userExists) {
      // throw new BadRequestException('Guest already exists');
        return res.status(HttpStatus.BAD_REQUEST).send({message:'Guest already exists'})
    }
    const fileData: string[] = []; 

    for (const file of files) {
        const ext=file.originalname.split('.').pop()
        const filename=path.parse(file.originalname).name
        const filePath= folderPath + '/' +  filename + '-' + Date.now() + '.' + ext
          
          await writeFile(filePath, file.buffer,);
        const fileBaseName = await path.basename(filePath)
      fileData.push(fileBaseName)
          
      }
    
      const data={
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
          images: fileData,
          user_id:new Types.ObjectId(user_id)
      }
      
      
      const guestData=await this.guestModel.create(data)
      const addressData={
        ...addressInfo,guest_id:guestData._id
      }
      
      await this.addressModel.create(addressData)
      // return {message:"Guest ragister successfully"}
      return res.status(HttpStatus.CREATED).send({message:"Guest ragister successfully"})
    }catch(error){
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllGuest (user_id:string){
     const guestData = await this.guestModel.aggregate([
        { $match: { user_id: new Types.ObjectId(user_id) } },
      
      {
        $lookup: {
          from: 'addresses',
          localField: '_id',
          foreignField: 'guest_id',
          as: 'addressData',
        },
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
     
      //  {
      // $project: {
      //    guest: {
      //       $filter: {
      //          input: "$guest",
      //          as: "g",
      //          cond: { $eq: [ "$$g.user_id",new Types.ObjectId(user_id)  ] }
      //       }
      //    }
      // }
  //  }
    ]);
    return {guest:guestData};

  }
  
    async searchGuest (req){
      
      const {search,type} = req.query
     const searchParse = JSON.parse(search);

       console.log("search",search,"parse",searchParse)
  //    searchParse.map((value)=>{
   
  //    const  keys=value.key.split('.')
  // //  console.log("value",value)

  //  console.log("arr",keys)

   
  // })
let pipeline:any []=[]
let matchConditions: { [key: string]: any }[] = [];
let comanyMatch={}
let guestData:any
if(type === 'all'){
  if (searchParse && Array.isArray(searchParse) ) {
    searchParse.forEach((obj) => {
        const { key, value } = obj; 
        console.log("key, value",key, value)
        if (key && value) {
                      
          matchConditions.push({
        
             [key]: value.toString().toLowerCase().trim()
        });
              
            
        }
      })

    }
    if (matchConditions.length > 0) {
      pipeline.push({
          $match: { $and: matchConditions },
        });
    }
     guestData=await this.getSearchGuest(pipeline)
    console.log("matchConditions",matchConditions)

}else if(type === "company"){
  console.log("searchParse",searchParse[0])
  comanyMatch={$match: { 'company_name': searchParse[0].value.toString().toLowerCase().trim() }}
  guestData = await this.getSearchGuest([comanyMatch])
  

}
    
    
    return {guest:guestData};
  }




 async getSearchGuest(pipeline){
  const guestData = await this.guestModel.aggregate([
    {
      $lookup: {
        from: 'addresses',
        localField: '_id',
        foreignField: 'guest_id',
        as: 'addressData',
      },
    },
     {
      $unwind:'$addressData'
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
    },
    ...pipeline
  //  { $match: { $and: [
  //     //  { first_name: 'bablu' },

  //     { 'addressData.street_name': 'testbuilfd' },
  //     { 'addressData.building_no': '12341' },
  //     { 'addressData.appartment_no': '3452' },
  //   ] }},
   
  ]);
  return guestData
}

}



