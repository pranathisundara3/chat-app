import jwt from "jsonwebtoken";

//function to generate a token for a user
export const generateToken = (user) => {
    const token=jwt.sign({id:user._id},process.env.JWT_SECRET);
    return token;
}