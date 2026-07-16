import { HttpStatus, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import * as path from 'path'; // FIX: Use asterisk import for path in Node/TypeScript
import * as fs from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from 'src/schemas/post.schema';
@Injectable()
export class PostService {
  constructor(
      @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ){}
  async create(photos: Express.Multer.File[],createPostDto: CreatePostDto,req,res) {
    try{

      const {post_type, category_id, title, description, currency, price, quantity, additional_info} = createPostDto
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

  findAll() {
    return `This action returns all post`;
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
