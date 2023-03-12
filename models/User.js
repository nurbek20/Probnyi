import {model,Schema} from "mongoose";

const userSchema=new Schema({
    fullName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    imageUrl:String
},{timestamps:true})
export default model('User',userSchema)
