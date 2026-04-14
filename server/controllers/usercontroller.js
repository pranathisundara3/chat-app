import { generateToken } from "../lib/utilis.js";
import User from "../models/user.js";
import Message from "../models/message.js";
import ChatRequest from "../models/chatRequest.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

const resolveGoogleClientId = () => {
    return process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
};

const sanitizeUser = (userDoc) => {
    const userData = userDoc.toObject ? userDoc.toObject() : userDoc;
    delete userData.password;
    return userData;
};

const normalizeUsername = (value = "") => value
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 20);

const buildBaseUsername = (fullName = "", email = "") => {
    const fromName = normalizeUsername(fullName.replace(/\s+/g, ""));
    if (fromName) return fromName;

    const emailPrefix = email.split("@")[0] || "user";
    return normalizeUsername(emailPrefix) || "user";
};

const generateUniqueUsername = async (sourceValue) => {
    const base = buildBaseUsername(sourceValue);
    let username = base;
    let counter = 0;

    while (await User.exists({ username })) {
        counter += 1;
        const suffix = String(counter);
        const truncatedBase = base.slice(0, Math.max(3, 20 - suffix.length));
        username = `${truncatedBase}${suffix}`;
    }

    return username;
};

const generateUniqueChatCode = async () => {
    let chatCode = "";

    do {
        chatCode = crypto.randomBytes(4).toString("hex");
    } while (await User.exists({ chatCode }));

    return chatCode;
};

const ensureIdentityFields = async (userDoc) => {
    let shouldSave = false;

    if (!userDoc.username) {
        userDoc.username = await generateUniqueUsername(userDoc.fullName || userDoc.email);
        shouldSave = true;
    }

    if (!userDoc.chatCode) {
        userDoc.chatCode = await generateUniqueChatCode();
        shouldSave = true;
    }

    if (shouldSave) {
        await userDoc.save();
    }
};

//signup new user
export const signup = async (req, res) => {
    const { fullName, email, password, bio, username } = req.body;
    try {
        if(!fullName || !email || !password){
            return res.json({success:false ,message:"Missing required fields"})
        }

        const normalizedEmail = email.toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if(user){
            return res.json({success:false ,message:"Account already exists"})
        }

        const resolvedUsername = await generateUniqueUsername(username || fullName || normalizedEmail);
        const chatCode = await generateUniqueChatCode();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName,
            email: normalizedEmail,
            username: resolvedUsername,
            password: hashedPassword,
            chatCode,
            bio: bio || "Hey there! I am using QuickChat.",
        });
    
        const token = generateToken(newUser._id);
        res.json({success:true ,userData:sanitizeUser(newUser),token, message:"Account created successfully"})
    }
    catch(error){
        console.log(error.message);
        res.json({success:false ,message:error.message})
    }
}
// controller to login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email: email?.toLowerCase() });

        if(!userData){
            return res.json({success:false ,message:"Invalid Credentials"})
        }

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if(!isPasswordCorrect){
            return res.json({success:false ,message:"Invalid Credentials"})
        }

        await ensureIdentityFields(userData);

        const token = generateToken(userData._id);
        res.json({success:true ,userData:sanitizeUser(userData),token, message:"Logged in successfully"})
    } catch(error){
        console.log(error.message);
        res.json({success:false ,message:error.message})
    }
}

// controller to search users by username
export const searchUser = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const searchText = (req.query.query || "").trim();

        if (!searchText) {
            return res.json({ success: true, users: [] });
        }

        const matchedUsers = await User.find({
            username: { $regex: searchText, $options: "i" },
            _id: { $ne: loggedInUserId },
        })
            .select("fullName username profilePic bio")
            .limit(20)
            .lean();

        if (!matchedUsers.length) {
            return res.json({ success: true, users: [] });
        }

        const matchedUserIds = matchedUsers.map((user) => user._id);

        const [requestDocs, relatedMessages] = await Promise.all([
            ChatRequest.find({
                $or: [
                    { senderId: loggedInUserId, receiverId: { $in: matchedUserIds } },
                    { receiverId: loggedInUserId, senderId: { $in: matchedUserIds } },
                ],
            })
                .select("senderId receiverId status")
                .lean(),
            Message.find({
                $or: [
                    { senderId: loggedInUserId, receiverId: { $in: matchedUserIds } },
                    { receiverId: loggedInUserId, senderId: { $in: matchedUserIds } },
                ],
            })
                .select("senderId receiverId")
                .lean(),
        ]);

        const loggedInUserIdStr = loggedInUserId.toString();
        const requestByOtherUser = new Map();

        requestDocs.forEach((requestDoc) => {
            const senderId = requestDoc.senderId.toString();
            const receiverId = requestDoc.receiverId.toString();
            const otherUserId = senderId === loggedInUserIdStr ? receiverId : senderId;
            requestByOtherUser.set(otherUserId, requestDoc);
        });

        const userIdsWithChatHistory = new Set();
        relatedMessages.forEach((messageDoc) => {
            const senderId = messageDoc.senderId.toString();
            const receiverId = messageDoc.receiverId.toString();
            const otherUserId = senderId === loggedInUserIdStr ? receiverId : senderId;
            userIdsWithChatHistory.add(otherUserId);
        });

        const users = matchedUsers.map((user) => {
            const userId = user._id.toString();

            if (userIdsWithChatHistory.has(userId)) {
                return { ...user, chatStatus: "accepted" };
            }

            const requestDoc = requestByOtherUser.get(userId);
            if (!requestDoc) {
                return { ...user, chatStatus: "none" };
            }

            if (requestDoc.status === "accepted") {
                return { ...user, chatStatus: "accepted", requestId: requestDoc._id };
            }

            if (requestDoc.status === "pending") {
                const chatStatus = requestDoc.senderId.toString() === loggedInUserIdStr
                    ? "pending-sent"
                    : "pending-received";

                return { ...user, chatStatus, requestId: requestDoc._id };
            }

            return { ...user, chatStatus: "none" };
        });

        res.json({ success: true, users });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// controller to login or register user with google
export const googleLogin = async (req, res) => {
    try {
        const googleClientId = resolveGoogleClientId();

        if (!googleClientId) {
            return res.json({success:false ,message:"Google login is not configured on server"});
        }

        const googleClient = new OAuth2Client(googleClientId);

        const { credential, profile } = req.body;

        if (!credential) {
            return res.json({success:false ,message:"Google credential is required"});
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: googleClientId,
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

            const username = await generateUniqueUsername(profile?.username || fullName || email);
            const chatCode = await generateUniqueChatCode();

            userData = await User.create({
                fullName,
                email,
                username,
                password: hashedPassword,
                chatCode,
                bio: profile?.bio || "Hey there! I am using QuickChat.",
                profilePic,
            });
        } else if (profilePic && !userData.profilePic) {
            userData.profilePic = profilePic;
            await userData.save();
        }

        await ensureIdentityFields(userData);

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
    res.json({success:true ,userData:sanitizeUser(updatedUser)})
}
        catch (error) {
        console.log(error.message);
        res.json({success:false ,message:error.message})
    }
}