import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const stats = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(userId) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videosLikes",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        foreignField: "channel",
        localField: "_id",
        as: "subscriptions",
      },
    },
    {
      $unwind: "$videosLikes",
    },
    {
      $lookup: {
        from: "likes",
        localField: "videosLikes._id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        totalLikes: { $sum: { $size: "$likes" } },
        totalViews: { $sum: "$videosLikes.views" },
        totalSubscribers: { $size: "$subscriptions" },
      },
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        totalLikes: 1,
        totalSubscribers: 1,
        totalViews: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, stats[0], "Stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const channelVideos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        foreignField: "video",
        localField: "_id",
        as: "likes",
      },
    },
    {
      $addFields: {
        totalLikes: {
          $size: "$likes",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelVideos, "Channel videos fetched successfully")
    );
});

export { getChannelStats, getChannelVideos };
