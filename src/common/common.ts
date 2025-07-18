export const deleteData = async(ids, model) => {
    const res = await model.deleteMany({ _id: { $in: ids } });
    if (res.deletedCount < 1) {
        return false
    }else{
        return true
    }
   
}; 