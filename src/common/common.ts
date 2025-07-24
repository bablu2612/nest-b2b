import { Types } from "mongoose";

export const deleteData = async(ids, model) => {
    const res = await model.deleteMany({ _id: { $in: ids.map((id)=> new Types.ObjectId(id) )} });
    if (res.deletedCount < 1) {
        return false
    }else{
        return true
    }
   
}; 

