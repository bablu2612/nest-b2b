import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { error } from 'console';

import { writeFile, mkdir } from 'fs/promises';
import * as path from 'path';
import * as fs from 'fs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Guest, GuestDocument } from 'src/schemas/guest.schema';
import { Address, AddressDocument } from 'src/schemas/address.schema';
import { Report, ReportDocument } from 'src/schemas/report.schema';
@Injectable()
export class GuestService {
  constructor(
    @InjectModel(Guest.name) private guestModel: Model<GuestDocument>,
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
  ) {}

  async createGuest(
    files: Express.Multer.File[],
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

      
      const reportData = {
        check_in,
        check_out,
        message,
        images: fileData,
        guest_id: guestData._id,
      };
     
      await this.reportModel.create(reportData);
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

  async getAllGuest(user_id: string) {
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
    $unwind: {
      path: '$addressData',
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $lookup: {
      from: 'reports',
      localField: '_id',
      foreignField: 'guest_id',
      as: 'reportData',
    },
  },
  {
    $unwind: {
      path: '$reportData',
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $addFields: {
      reportData: { $cond: [{ $ifNull: ['$reportData', false] }, ['$reportData'], []] }
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
    $unwind: {
      path: '$userData',
      preserveNullAndEmptyArrays: true
    }
  },
]);

    return { guest: guestData };
  }

  async searchGuest(req) {
    const { search } = req.query;
    try {
      const searchParse = JSON.parse(search);
      let pipeline: any[] = [];
      let anyThreePipeline: any[] = [];
      let matchConditions: { [key: string]: any }[] = [];
      let anyThreeMatchConditions: { [key: string]: any }[] = [];
      let typeAllMatch: any;
      let comanyMatch: any = undefined;
      let typeComapnyMatch: any = undefined;

      let typeThreeMatch: any;
      const minMatch = 3;

      if (searchParse && Array.isArray(searchParse)) {
        searchParse.forEach((obj) => {
          const { key, value } = obj;
          if (key && value) {
            //  match all data
            matchConditions.push({
              // [key]: value.toString()
              [key]: { $regex: `^${value}$`, $options: 'i' }, // Case-insensitive exact match
            });
            //match company name
            if (key === 'company_name' && value) {
              comanyMatch = {
                $match: { company_name: value.toString().toLowerCase().trim() },
              };
            }
            //match any three data
            anyThreeMatchConditions.push({
              $cond: [
                {
                  $eq: [
                    { $toLower: `$${key}` },
                    value.toString().toLowerCase().trim(),
                  ],
                },
                1,
                0,
              ],
            });
          }
        });
      }

      if (matchConditions.length > 0) {
        pipeline.push({
          $match: { $and: matchConditions },
        });
      }

      typeAllMatch = await this.getSearchGuest(pipeline);
      if (comanyMatch) {
        typeComapnyMatch = await this.getSearchGuest([comanyMatch]);
      }
      if (anyThreeMatchConditions.length > 0) {
        anyThreePipeline.push({
          $match: {
            $expr: {
              $gte: [
                {
                  $sum: [...anyThreeMatchConditions],
                },
                minMatch,
              ],
            },
          },
        });
      }
      typeThreeMatch = await this.getSearchGuest(anyThreePipeline);
      return {
        accurateMatch: typeAllMatch,
        sameCompanyData: typeComapnyMatch !== undefined ? typeComapnyMatch : [],
        partisalMatch: typeThreeMatch,
      };
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getSearchGuest(pipeline) {
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
        $unwind: '$addressData',
      },
      {
        $lookup: {
          from: 'reports',
          localField: '_id',
          foreignField: 'guest_id',
          as: 'reportData',
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
        $unwind: '$userData',
      },
      ...pipeline,
    ]);
    return guestData;
  }

  async searchGuestName(req) {
    const { search } = req.query;

    try {
      // const guest=await this.guestModel.find({
      //  $or:[{first_name:{$regex: search.trim(), $options:"i"}},{last_name:{$regex: search.trim(), $options:"i"}}]
      //   // last_name:{$regex: search.trim(), $options:"i"}
      // })
      const guest = await this.guestModel.aggregate([
        {
          $match: {
            $or: [
              { first_name: { $regex: search.trim(), $options: 'i' } },
              { last_name: { $regex: search.trim(), $options: 'i' } },
              { company_name: { $regex: search.trim(), $options: 'i' } },
              { nationality: { $regex: search.trim(), $options: 'i' } },
              { document_type: { $regex: search.trim(), $options: 'i' } },
              { document_number: { $regex: search.trim(), $options: 'i' } },
              { telephone: { $regex: search.trim(), $options: 'i' } },
              { email: { $regex: search.trim(), $options: 'i' } },
            ],
          },
        },
        {
          $lookup: {
            from: 'addresses',
            localField: '_id',
            foreignField: 'guest_id',
            as: 'addressData',
          },
        },
        {
          $unwind: '$addressData',
        },
      ]);

      return { guest };
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getGuestById(req) {
    const { id } = req.params;
    let idMatch;
    try {
      idMatch = { $match: { _id: new Types.ObjectId(id) } };
      const [guest] = await this.getSearchGuest([idMatch]);
      return { guest };
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
