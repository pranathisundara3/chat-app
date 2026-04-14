import jwt from "jsonwebtoken";

//function to generate a token for a user
export const generateToken = (userOrId) => {
    const resolvedUserId = typeof userOrId === "object" && userOrId !== null
        ? userOrId._id || userOrId.id
        : userOrId;

    const token=jwt.sign({id:resolvedUserId},process.env.JWT_SECRET);
    return token;
}