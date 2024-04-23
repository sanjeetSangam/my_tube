import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const likedBy = req.user?._id;

  const oldLike = await Like.findOneAndDelete({
    $and: [{ video: videoId, likedBy }],
  });

  if (oldLike) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Like removed successfully"));
  }

  const newLike = await Like.create({
    video: videoId,
    likedBy,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newLike, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const likedBy = req.user?._id;

  const oldLike = await Like.findOneAndDelete({
    $and: [{ comment: commentId, likedBy }],
  });

  if (oldLike) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Like removed successfully"));
  }

  const newLike = await Like.create({
    comment: commentId,
    likedBy,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newLike, "Comment liked successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const likedBy = req.user?._id;

  const oldLike = await Like.findOneAndDelete({
    $and: [{ tweet: tweetId, likedBy }],
  });

  if (oldLike) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Like removed successfully"));
  }

  const newLike = await Like.create({
    tweet: tweetId,
    likedBy,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newLike, "Tweet liked successfully"));
});

const getLikesVideos = asyncHandler(async (req, res) => {
  const likedBy = req.user?._id;

  const likedVideos = await Like.aggregate([
    {
      $match: { likedBy: new mongoose.Types.ObjectId(likedBy) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
      },
    },
    {
      $unwind: "$likedVideos", // Unwind the array to get individual documents
    },
    {
      $replaceRoot: { newRoot: "$likedVideos" }, // Replace root to make the liked video documents the top level
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked Video fetched"));
});

export { toggleCommentLike, toggleTweetLike, getLikesVideos, toggleVideoLike };
