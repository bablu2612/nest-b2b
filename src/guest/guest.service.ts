import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
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
   
  async createGuest (files:Express.Multer.File[],body:any,user_id:any){
 
    try{  
      const {first_name,last_name,company_name,nationality,document_type,document_number,telephone,email,check_in,check_out,message,...addressInfo}=body
      if(files.length === 0){
        throw new BadRequestException('Please select atleast one file');
      }

      const folderPath = path.join(__dirname, '..', '..', 'public','uploads');
    if (!fs.existsSync(folderPath)) {
          await mkdir(path.dirname(folderPath), { recursive: true });
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
          user_id:user_id
      }
      
      
      const guestData=await this.guestModel.create(data)
      const addressData={
        ...addressInfo,guest_id:guestData._id
      }
      
      await this.addressModel.create(addressData)
      return {message:"Guest ragister successfully"}
    }catch(error){
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllGuest (user_id:string){
     const guestData = await this.guestModel.aggregate([
      // { $match: { user_id : new Types.ObjectId(user_id)} },
      //  { $match: { user_id: new Types.ObjectId(user_id) } },
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
//       {
//   $project: {
//     guest: {
//       $filter: {
//         input: '$guest',
//         as: 'g',
//         cond: {
//           $eq: ['$$g.user_id', new Types.ObjectId(user_id)],
//         },
//       },
//     },
//   },
// }
      
    ]);
    return {guest:guestData};

  }
  
}
