import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
    sendRequest,
    getRequests,
    acceptRequest,
    rejectRequest,
    removeConnection,
} from "../controllers/chatRequestController.js";

const chatRequestRouter = express.Router();

chatRequestRouter.get("/", protectRoute, getRequests);
chatRequestRouter.post("/send/:id", protectRoute, sendRequest);
chatRequestRouter.put("/accept/:id", protectRoute, acceptRequest);
chatRequestRouter.put("/reject/:id", protectRoute, rejectRequest);
chatRequestRouter.delete("/remove/:id", protectRoute, removeConnection);

export default chatRequestRouter;