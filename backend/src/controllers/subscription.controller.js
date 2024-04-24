import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriber = req.user?._id;

  if (subscriber.equals(new mongoose.Types.ObjectId(channelId)))
    throw new ApiError(400, "Can't follow own profile");

  const subscription = await Subscription.findOneAndDelete({
    $and: [
      {
        subscriber,
        channel: channelId,
      },
    ],
  });

  if (subscription)
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unsubscribed successfully"));

  const newSubscription = await Subscription.create({
    subscriber,
    channel: channelId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newSubscription, "Subscribed successfully"));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",

        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
              coverImageUrl: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalSubscribers: {
          $size: "$subscribers",
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          subscribers: "$subscribers",
          totalSubscribers: "$totalSubscribers",
        },
      },
    },
  ]);

  const data = subscribers?.length > 0 ? subscribers[0] : [];
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        data,
        `${data?.subscribers?.length || 0} subscribers found`
      )
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  const subscriberChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribed",

        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
              coverImageUrl: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalSubscribed: {
          $size: "$subscribed",
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          subscribed: "$subscribed",
          totalSubscribed: "$totalSubscribed",
        },
      },
    },
  ]);

  const data = subscriberChannels?.length > 0 ? subscriberChannels[0] : [];
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        data,
        `${data?.subscribed?.length || 0} subscribed channels found`
      )
    );
});

export { toggleSubscription, getSubscribedChannels, getUserChannelSubscribers };
