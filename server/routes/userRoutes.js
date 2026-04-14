import express from "express";
import { signup, login, googleLogin, updateProfile, checkAuth } from "../controllers/usercontroller.js";
import { protectRoute } from "../middleware/auth.js";
const userRouter = express.Router();
userRouter.post("/signup",signup);
userRouter.post("/login",login);
userRouter.post("/google",googleLogin);

userRouter.put("/update-profile",protectRoute,updateProfile);
userRouter.get("/check",protectRoute,checkAuth);
export default userRouter;