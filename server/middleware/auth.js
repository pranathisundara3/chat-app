
import User from "../models/user.js";
import jwt from "jsonwebtoken";


//middleware to protect routes
export const protectRoute = async (req, res, next) => {
    try {
        const token = req.headers.token;

        const decoded=jwt.verify(token, process.env.JWT_SECRET);
        const user=await User.findById(decoded.id).select("-password");
        if(!user){
            return res.json({success:false ,message:"user not found"})
        }

        req.user = user;
        next();
    } catch (error) {
        res.json({success:false ,message:error.message})
    }
}
//contoller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.json({success:true ,user:req.user});
}
