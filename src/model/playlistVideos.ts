import mongoose from "mongoose";

const ThumbnailSchema = new mongoose.Schema({
  url: { type: String, required: true },
  width: { type: Number },
  height: { type: Number },
});

const ResourceSchema = new mongoose.Schema({
  kind: { type: String, required: true },
  videoId: { type: String, required: true },
});

const VideoSchema = new mongoose.Schema({
  kind: { type: String, required: true },
  etag: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  snippet: {
    publishedAt: { type: Date, required: true },
    channelId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    thumbnails: {
      default: ThumbnailSchema,
      medium: ThumbnailSchema,
      high: ThumbnailSchema,
      standard: ThumbnailSchema,
      maxres: ThumbnailSchema,
    },
    channelTitle: { type: String},
    playlistId: { type: String, required: true },
    position: { type: Number, required: true },
    resourceId: ResourceSchema,
    videoOwnerChannelTitle: { type: String },
    videoOwnerChannelId: { type: String},
  },
});

const PlaylistSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  playlistId: { type: String, required: true, unique: true },
  videos: [VideoSchema],
});

const PlaylistVideos = mongoose.model("PlaylistVideos", PlaylistSchema);

export default PlaylistVideos;
