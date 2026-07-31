import { HttpStatus, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import * as path from 'path'; // FIX: Use asterisk import for path in Node/TypeScript
import * as fs from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import mongoose, { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from 'src/schemas/post.schema';
import { deleteData, getAllDataPostWithPagination } from 'src/common/common';
@Injectable()
export class PostService {
  constructor(
      @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ){}
  async create(photos: Express.Multer.File[],createPostDto: CreatePostDto,req,res) {
    try{

      const {post_type, category_id, title, description,country, currency, price, quantity, additional_info} = createPostDto
       if (!photos || photos.length === 0) {
            return res.status(HttpStatus.BAD_REQUEST).send({message:'Please select atleast one file'});
          }
     
          const folderPath = path.join(__dirname, '..', '..', 'public', 'photos');
          
          if (!fs.existsSync(folderPath)) {
            await mkdir(path.dirname(folderPath), { recursive: true });
          }
         
          const fileData: string[] = [];
    
          for (const file of photos) {
            const ext = file.originalname.split('.').pop();
            const filename = path.parse(file.originalname).name;
            const filePath = folderPath + '/' + filename + '-' + Date.now() + '.' + ext;
    
            await writeFile(filePath, file.buffer);
            const fileBaseName = await path.basename(filePath);
            fileData.push(fileBaseName);
          }
            const existPost = await this.postModel.findOne({title})
            if(existPost){
               return res.status(HttpStatus.BAD_REQUEST).send({ message: 'Post already exist'})
            }
    
            const data={  
              post_type,
              category_id: new Types.ObjectId(category_id),
              title,
              description,
              country,
              currency,
              price,
              quantity,
              additional_info,
              photos: fileData,
              user_id:  new Types.ObjectId(req.user.id)
          }

        const postdata = await this.postModel.create(data)

        return res.status(HttpStatus.CREATED).send({ message: 'Post created successfully',postdata})
    }
    catch(err){
     return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message})
     }

  }

  async findAll(req,res) {
    try{
      const {page, limit, filters,sort_order="desc"} = req.query;
      const parseFilter = filters ? JSON.parse(filters) : [];
      // console.log("filter",parseFilter)

      let match:any 
       const statusMatch= {
        $match:{
           status:"online"
      }}
      if(parseFilter.length > 0){
          match = {
          $match: {
            $and: []
          }
        };
        let matchData:any = {}

        for(const filter  of parseFilter){
          // if (filter.key === "createdAt") {
          //   matchData[filter.key] = new Date(filter.value);
          // } else if (filter.key === "category_id") {
          if (filter.key === "category_id") {
            matchData[filter.key] = new mongoose.Types.ObjectId(filter.value);
          } else {
            matchData[filter.key] = filter.value;
          }

          match.$match.$and.push(matchData)
        }
      }

      const userLookup={
        $lookup:{
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userData'
        }
      }
      const unwindUser:any={
        $unwind:'$userData'
      }
      const companyLookup={
          $lookup: {
            from: 'companies',
            localField: 'userData._id',
            foreignField: 'user_id',
            as: 'companyData',
          },
      }
       const unwindCompanyLookup:any={
        $unwind:'$companyData'
      }

       const categoryLookup={
        $lookup:{
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'categoryData'
        }
      }
      const unwindCategoryLookup:any={
              $unwind:'$categoryData'
            }
            const sorting={
                $sort: { "createdAt": sort_order === "asc" ? 1: -1 } ,
            }
    const {data,pagination} = await getAllDataPostWithPagination(this.postModel,page,limit,userLookup,unwindUser,companyLookup,unwindCompanyLookup,categoryLookup,unwindCategoryLookup,match,sorting,statusMatch)
    return res.status(HttpStatus.OK).send({data,pagination,url: process.env.POST_BASE_URL})
  }catch(err){
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message})
  }


  
  }

  async findOne(id: any,req,res) {
    try{
     
        const [data] = await this.postModel.aggregate([
          {
            $match:{
              _id: new mongoose.Types.ObjectId(id)
            }
          },
          {
            $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'userData'
          }
        },
        {
          $unwind:'$userData'
        },
        {
            $lookup: {
              from: 'companies',
              localField: 'userData._id',
              foreignField: 'user_id',
              as: 'companyData',
            },
          
        },
        {
          $unwind:'$companyData'
        },
        {
          $lookup:{
            from: 'categories',
            localField: 'category_id',
            foreignField: '_id',
            as: 'categoryData'
          }
        }
      ]);
      return res.status(HttpStatus.OK).send({data})
    
     }catch(err){
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message})
     }
   
  }

  // async update(id,photos, updatePostDto: UpdatePostDto,req,res) {
  //   try{
  //   const {post_type, category_id, title, description, currency, price, quantity, additional_info} = updatePostDto
  //     //  if (!photos || photos.length === 0) {
  //     //       return res.status(HttpStatus.BAD_REQUEST).send({message:'Please select atleast one file'});
  //     //     }
     
  //         const folderPath = path.join(__dirname, '..', '..', 'public', 'photos');
          
  //         if (!fs.existsSync(folderPath)) {
  //           await mkdir(path.dirname(folderPath), { recursive: true });
  //         }
         
  //         const fileData: string[] = [];
    
  //         for (const file of photos) {
  //           const ext = file.originalname.split('.').pop();
  //           const filename = path.parse(file.originalname).name;
  //           const filePath = folderPath + '/' + filename + '-' + Date.now() + '.' + ext;
    
  //           await writeFile(filePath, file.buffer);
  //           const fileBaseName = await path.basename(filePath);
  //           fileData.push(fileBaseName);
  //         }
  //           const existPost = await this.postModel.findOne({title})
  //           if(existPost && existPost?._id.toString() !== id.toString()){
  //              return res.status(HttpStatus.BAD_REQUEST).send({ message: 'Post already exist'})
  //           }
    
  //           const data={  
  //             post_type,
  //             category_id: new Types.ObjectId(category_id),
  //             title,
  //             description,
  //             currency,
  //             price,
  //             quantity,
  //             additional_info,
  //             photos: fileData,
  //             user_id:  new Types.ObjectId(req.user.id)
  //         }

  //       const postdata = await this.postModel.findByIdAndUpdate(id,data,{new:true})

  //       return res.status(HttpStatus.CREATED).send({ message: 'Post created successfully',postdata})
  //   }
  //   catch(err){
  //    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message})
  //    }
    
  // }

  async remove(req,res) {
    try{
      const {ids} = req.body;
      const delData = await deleteData(ids,this.postModel)
      if(delData){
        return res.status(HttpStatus.OK).send({message:"Post deleted successfully"})
      }
      return res.status(HttpStatus.BAD_REQUEST).send({message:"Post not deleted"})
    }catch(err){
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message})
    }
  }


   async getCurrentPost(id,req,res) {
    try{
        const data = await this.postModel.aggregate([
         
          {
            $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'userData'
          }
        },
        {
          $unwind:'$userData'
        },
         {
            $match:{
              user_id: new mongoose.Types.ObjectId(id),
              // status:"online"
            }
          },
      ])
      return res.status(HttpStatus.OK).send({data,url: process.env.POST_BASE_URL})
    }catch(err){
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message})
    }
  }

   async getHistoryPost(id,req,res) {
    try{
        const data = await this.postModel.aggregate([
         
          {
            $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'userData'
          }
        },
        {
          $unwind:'$userData'
        },
         {
            $match:{
              user_id: new mongoose.Types.ObjectId(id),
              status:{
                $in:["removed","sold"]
              }
            }
          },
      ])
      return res.status(HttpStatus.OK).send({data})
    }catch(err){
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message})
    }
  }
  
  
}
