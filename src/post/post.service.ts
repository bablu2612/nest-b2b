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

const fsPromise = require('fs').promises;
@Injectable()
export class PostService {
  constructor(
      @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ){}
  async create(photos: Express.Multer.File[],createPostDto: CreatePostDto,req,res) {
    try{

      const {post_type, category_id, title, description,country,address,lat,long,currency, price,weeklyPrice,monthlyPrice, quantity, additional_info,condition} = createPostDto
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
              address,
              lat,
              long,
              currency,
              price,
              weeklyPrice,
              monthlyPrice,
              quantity,
              additional_info,
              photos: fileData,
              user_id:  new Types.ObjectId(req.user.id),
              condition
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
      return res.status(HttpStatus.OK).send({data,url: process.env.POST_BASE_URL})
    
     }catch(err){
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message})
     }
   
  }

  async update(id,photos, updatePostDto: UpdatePostDto,req,res) {
    try{
        const {post_type, category_id, title, description,country,address,lat,long, currency, price,weeklyPrice,monthlyPrice, quantity, additional_info,condition,t,existingPhotos=[]} = updatePostDto
        const folderPath = path.join(__dirname, '..', '..', 'public', 'photos');
        let fileData: string[] = [];

        const currentPost: any = await this.postModel.findById(id);
        if (!currentPost) {
          return res.status(HttpStatus.NOT_FOUND).send({ message: 'Post not found' });
        }

        const existPost:any = await this.postModel.findOne({title})
        if(existPost && existPost?._id.toString() !== id.toString()){
            return res.status(HttpStatus.BAD_REQUEST).send({ message: 'Post already exist'})
        }
       if (!fs.existsSync(folderPath)) {
          await mkdir(path.dirname(folderPath), { recursive: true });
        }
console.log("update",updatePostDto)
    
        let data:any={  
          post_type,
          category_id: new Types.ObjectId(category_id),
          title,
          description,
          country,
          address,
          lat,
          long,
          currency,
          price,
          weeklyPrice,
          monthlyPrice,
          quantity,
          additional_info,
          // photos: fileData,
          user_id:  new Types.ObjectId(req.user.id),
          condition
        }

//         if (!photos || photos.length === 0  && t === false) {
//         fileData = existPost?.photos
//         }else if(photos.length > 0  && t === true){
// let sameFile=[]
        
// sameFile=photos.filter((file)=>file.originalname ===  existPost?.photos)
//             for (const file of photos) {
//              const new_file:any= existPost?.photos.find((p)=> p !== file.originalname)

//               if(file.originalname !== existPost?.photos){
//                 const ext = file.originalname.split('.').pop();
//                 const filename = path.parse(file.originalname).name;
//                 const filePath = folderPath + '/' + filename + '-' + Date.now() + '.' + ext;
        
//                 await writeFile(filePath, file.buffer);
//                 const fileBaseName = await path.basename(filePath);
//                 fileData.push(fileBaseName);
//               }
// }
 // }

           

            if(t === 'true' && photos.length > 0){
              console.log("photos",photos)
              const sameFiles= existingPhotos || []
              console.log("sameFiles",sameFiles)


              for (const file of photos) { 
                const ext = file.originalname.split('.').pop();
                const filename = path.parse(file.originalname).name;
                const filePath = folderPath + '/' + filename + '-' + Date.now() + '.' + ext;
        
                await writeFile(filePath, file.buffer);
                const fileBaseName = await path.basename(filePath);
                fileData.push(fileBaseName);
                
              }

              const filesArr = [...sameFiles, ...fileData];

              console.log("filesArr",filesArr); 

              data.photos=filesArr;
              console.log("data.photos",data); 

              // file delete from folder
              const notExistPostPhoto = currentPost.photos.filter(
                (file) => existingPhotos && !existingPhotos.includes(file)
              );
              console.log("notExistPostPhoto000",notExistPostPhoto)

              const deletePromises = notExistPostPhoto.map(file => {
                const filePath = path.join(folderPath, file);

                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                  console.log(`Deleted: ${filePath}`);
                }
              });

              await Promise.all(deletePromises);
          
           
            }else if(t === 'false'){
             data.photos=currentPost.photos;

          }else if(t === 'true' && photos.length === 0){
              
            const notExistPostPhoto = currentPost.photos.filter(
              (file) => existingPhotos && !existingPhotos.includes(file)
            );
            console.log("notExistPostPhoto",notExistPostPhoto)

            const deletePromises = notExistPostPhoto.map(file => {
              const filePath = path.join(folderPath, file);
       
              // return fsPromise.unlink(filePath); // Deletes the individual file
            
              data.photos=existingPhotos;

                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                  console.log(`Deleted: ${filePath}`);
                }
            });

            await Promise.all(deletePromises);
          }
         
        const postdata = await this.postModel.findByIdAndUpdate(id,data,{new:true})

        return res.status(HttpStatus.CREATED).send({ message: 'Post updted successfully',postdata})
    }
    catch(err){
     return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message})
     }
    
  }

  async updatePostStatus(req,res) {
    try{
      const {id,status} = req.body;
      const postId=new mongoose.Types.ObjectId(id)
      await this.postModel.findByIdAndUpdate(postId,{status},{new:true})

      // const delData = await deleteData(ids,this.postModel)
      
        return res.status(HttpStatus.OK).send({message:`Post updated successfully`})

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
  
  

  async updateView(id,req,res) {
    try{
      const post = await this.postModel.findById(id)
      if(post){
        post.views = post.views + 1
        await post.save()
      }
   
        // const data = await this.postModel.findByIdAndUpdate(id,{views:req.body.views},{new:true})
       
      return res.status(HttpStatus.OK).send({message:"Post updated successfully"})
    }catch(err){
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message})
    }
  }
  
  

  async getPostByCategoryId(id: any,req,res) {
    try{
        const data = await this.postModel.aggregate([
          {
            $match:{
              category_id: new mongoose.Types.ObjectId(id)
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
      return res.status(HttpStatus.OK).send({data,url: process.env.POST_BASE_URL})
    
     }catch(err){
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: err.message})
     }
   
  }
}
