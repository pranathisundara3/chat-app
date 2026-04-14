import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
    sendRequest,
    getRequests,
    acceptRequest,
    rejectRequest,
} from "../controllers/chatRequestController.js";

const chatRequestRouter = express.Router();

chatRequestRouter.get("/", protectRoute, getRequests);
chatRequestRouter.post("/send/:id", protectRoute, sendRequest);
chatRequestRouter.put("/accept/:id", protectRoute, acceptRequest);
chatRequestRouter.put("/reject/:id", protectRoute, rejectRequest);

export default chatRequestRouter;