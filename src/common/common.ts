import { Types } from "mongoose";
import { Model } from 'mongoose';

export const deleteData = async(ids, model) => {
    const res = await model.deleteMany({ _id: { $in: ids.map((id)=> new Types.ObjectId(id) )} });
    if (res.deletedCount < 1) {
        return false
    }else{
        return true
    }
   
}; 
export const getAllDataWithPagination = async (
  model: any,
  page: string = "1",
  limit:string = "10",
  userModel?: any,
  userUnwind?: any,
  companyLookup?:any,
  unwindCompanyLookup?:any,
  categoryLookup?:any,
  unwindCategoryLookup?:any,
  match?:any,
  sorting?:any
 
) => {
  try {

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const paginationAggregate: any[] = [
      {...sorting},
        {
            $facet: {
                data: [
                { $skip: skip },
                { $limit: limitNumber }
                ],
                pagination: [
                { $count: "total" }
                ]
            }}
    ];

    
      if(match){
        paginationAggregate.unshift(match);
    }
      if (unwindCategoryLookup) {
      paginationAggregate.unshift(unwindCategoryLookup);
    }   
      if (categoryLookup) {
      paginationAggregate.unshift(categoryLookup);
    }   
     if (unwindCompanyLookup) {
      paginationAggregate.unshift(unwindCompanyLookup);
    }   

    if (companyLookup) {
      paginationAggregate.unshift(companyLookup);
    }   

     if (userUnwind) {
      paginationAggregate.unshift(userUnwind);
    }
      if (userModel) {
      paginationAggregate.unshift(userModel);
    }


//    console.log("paginationAggregate",paginationAggregate)
    const [result] = await model.aggregate(paginationAggregate);
    const total = result.pagination[0]?.total || 0;
    return {
      data: result.data || [],
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    };

  } catch (err) {
    throw err;
  }
};

