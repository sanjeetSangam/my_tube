import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getLikesVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getLikesVideos);
router.route("/v/:videoId").post(toggleVideoLike);
router.route("/t/:tweetId").post(toggleTweetLike);
router.route("/c/:commentId").post(toggleCommentLike);

export default router;
