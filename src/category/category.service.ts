import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from 'src/schemas/category.schema';

@Injectable()

export class CategoryService implements OnModuleInit{
    private categories:any=[
   "hotel furniture",
    "restaurant furniture",
    "kitchen equipment",
    "reception equipment",
    "bedroom furniture",
    "bathroom equipment",
    "outdoor furniture",
    "decoration",
    "electronics / IT",
    "laundry equipment",
    "housekeeping equipment",
    "conference equipment",
    "bar equipment",
    "spa & wellness equipment",
    "miscellaneous"
]
    constructor(
        @InjectModel(Category.name) 
        private readonly categoryModel: Model<CategoryDocument>,
       
  ) {}

   async onModuleInit() {
   
        for(const category of this.categories){
            const existCategory = await this.categoryModel.findOne({name: category})
            if(!existCategory){
                await new this.categoryModel({name:category}).save()
            }
        }
        console.log('Category inserted successfully');

    }


    
     async getAllCategory() {
        const categories = await this.categoryModel.find()
        return {categories}

     }
}
