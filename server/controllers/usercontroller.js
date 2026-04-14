import { generateToken } from "../lib/utilis.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sanitizeUser = (userDoc) => {
    const userData = userDoc.toObject ? userDoc.toObject() : userDoc;
    delete userData.password;
    return userData;
};

//signup new user
export const signup = async (req, res) => {
    const {fullName,email,password,bio} = req.body;
    try {
        if(!fullName || !email || !password || !bio){
            return res.json({success:false ,message:"missing Details"})
        }
        const user = await User.findOne({email});
        if(user){
            return res.json({success:false ,message:"Account already exists"})
        }
        const salt=await bcrypt.genSalt(10);
    const hashedPassword=await bcrypt.hash(password,salt);
    const newUser=await User.create({fullName,email,password:hashedPassword,bio});
    
const token=generateToken(newUser._id);
res.json({success:true ,userData:sanitizeUser(newUser),token, message:"Account created successfully"})
}
    catch(error){
        console.log(error.message);
        res.json({success:false ,message:error.message})
    }
}
// controller to login user
export const login = async (req, res) => {
    try{
    const {email,password} = req.body;
const userData=await User.findOne({email});
if(!userData){
    return res.json({success:false ,message:"Invalid Credentials"})
}
const isPasswordCorrect=await bcrypt.compare(password,userData.password);
if(!isPasswordCorrect){
    return res.json({success:false ,message:"Invalid Credentials"})    
}
const token=generateToken(userData._id);
res.json({success:true ,userData:sanitizeUser(userData),token, message:"Logged in successfully"})
} catch(error){
    console.log(error.message);
    res.json({success:false ,message:error.message})
}
}

// controller to login or register user with google
export const googleLogin = async (req, res) => {
    try {
        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.json({success:false ,message:"Google login is not configured on server"});
        }

        const { credential, profile } = req.body;

        if (!credential) {
            return res.json({success:false ,message:"Google credential is required"});
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const email = payload?.email?.toLowerCase();

        if (!email || !payload?.email_verified) {
            return res.json({success:false ,message:"Google account email is not verified"});
        }

        const fallbackName = email.split("@")[0];
        const fullName = payload?.name || profile?.fullName || fallbackName;
        const profilePic = payload?.picture || profile?.profilePic || "";

        let userData = await User.findOne({ email });

        if (!userData) {
            const randomPassword = crypto.randomUUID();
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            userData = await User.create({
                fullName,
                email,
                password: hashedPassword,
                bio: profile?.bio || "Hey there! I am using QuickChat.",
                profilePic,
            });
        } else if (profilePic && !userData.profilePic) {
            userData.profilePic = profilePic;
            await userData.save();
        }

        const token = generateToken(userData);
        res.json({
            success:true,
            userData:sanitizeUser(userData),
            token,
            message:"Logged in with Google successfully"
        });
    } catch (error) {
        console.log(error.message);
        res.json({success:false ,message:error.message});
    }
}
//controller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.json({success:true ,user:req.user});
}
//controller to update user profile details
export const updateProfile = async (req, res) => {
    try {
        
        const {profilePic,bio,fullName} = req.body;
    const userId=req.user._id;
    let updatedUser;
    if(!profilePic){
       updatedUser = await User.findByIdAndUpdate(userId,{bio,fullName},{new:true});
    }
    
    else{
        const upload = await cloudinary.uploader.upload(profilePic); 
        updatedUser = await User.findByIdAndUpdate(userId,{profilePic:upload.secure_url,bio,fullName},{new:true});
    }
    res.json({success:true ,userData:updatedUser})
}
        catch (error) {
        console.log(error.message);
        res.json({success:false ,message:error.message})
    }
}