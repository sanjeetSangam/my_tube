import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  // stage 1: initiliaze the query parameters
  const match = {};
  if (query) match.title = { $regex: query, $options: "i" };

  if (userId && !isValidObjectId(userId))
    throw new ApiError(400, "Invalid user id provided");

  if (userId) {
    match.owner = new mongoose.Types.ObjectId(userId);
  }

  const pipeline = [];
  pipeline.push({ $match: match });

  // stage 2: initiliaze the sort parameters
  const sort = {};
  if (sortBy && sortType) {
    sort[sortBy] = sortType === "desc" ? -1 : 1;
    pipeline.push({ $sort: sort });
  }

  // stage 3: initiliaze the pagination parameters
  pipeline.push({
    $facet: {
      paginatedData: [
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) },
      ],
      totalCount: [{ $count: "total" }],
    },
  });

  // execute the pipelines
  const videos = await Video.aggregate(pipeline).exec();
  const paginatedData = videos.length > 0 ? videos[0].paginatedData : [];
  const totalCount =
    videos.length > 0 && videos[0].totalCount.length > 0
      ? videos[0].totalCount[0].total
      : 0;
  return res.status(200).json(
    new ApiResponse(
      200,
      { paginatedData, totalCount },
      `${paginatedData?.length} videos found`
    )
  );
});

const publishVideo = asyncHandler(async (req, res, next) => {
  const { title, description } = req.body;
  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoFileLocalPath) throw new ApiError(400, "Video file is required");
  if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail is required");

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: videoFile?.duration,
    owner: req.user?._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video found successfully"));
});

const updateVideo = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  const { title, description } = req.body;
  let thumbnailLocalPath = req.file?.path || null;

  if (!title && !description && !thumbnailLocalPath)
    throw new ApiError(400, "Provide at least title or description thumbnail");

  if (title) video.title = title;
  if (description) video.description = description;
  if (thumbnailLocalPath) {
    thumbnailLocalPath = req.file?.path;
    await deleteOnCloudinary(video.thumbnail);
    const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    video.thumbnail = newThumbnail.url;
  }

  await video.save();
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;
  const deleteVideo = await Video.findByIdAndDelete(videoId);
  await deleteOnCloudinary(deleteVideo.videoFile, "video");
  await deleteOnCloudinary(deleteVideo.thumbnail);
  return res.status(200).json(200, {}, "Video deleted successfully");
});

const togglePublishStatus = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  video.isPublished = !video.isPublished;
  await video.save();
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Updated Successfully"));
});

export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
