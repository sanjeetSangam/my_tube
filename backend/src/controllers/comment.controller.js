import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const comments = await Comment.find({ video: videoId })
    .skip((parseInt(page) - 1) * limit)
    .limit(limit)
    .populate({
      path: "owner",
      select: "-password -refreshToken -accessToken -watchHistory -__v",
    });

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user?._id;
  const { videoId } = req.params;
  if (!isValidObjectId(videoId))
  throw new ApiError(404, "Invalid comment id");

  const comment = await Comment.create({
    content,
    owner: userId,
    video: videoId,
  });

  res
    .status(200)
    .json(new ApiResponse(201, comment, "Comment created successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId))
  throw new ApiError(404, "Invalid comment id");
  await Comment.findByIdAndDelete(commentId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  if (!isValidObjectId(commentId))
    throw new ApiError(404, "Invalid comment id");

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    { $set: { content } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

export { getVideoComments, addComment, deleteComment, updateComment };
