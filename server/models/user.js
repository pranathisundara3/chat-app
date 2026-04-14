import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    email:{type:String,required:true,unique:true},
    username:{type:String,trim:true,lowercase:true,unique:true,sparse:true,index:true},
    fullName:{type:String,required:true},
    password:{type:String,required:true,minlength:6},
    chatCode:{type:String,trim:true,unique:true,sparse:true,index:true},
    profilePic:{type:String,default:""},
    bio:{type:String},
},{timestamps:true})

 const User = mongoose.model("User",userSchema);
 export default User;