import mongoose from "mongoose";

const ThumbnailSchema = new mongoose.Schema({
  url: { type: String, required: true },
  width: { type: Number },
  height: { type: Number },
});

const PlaylistSchema = new mongoose.Schema({
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
    channelTitle: { type: String, required: true },
    localized: {
      title: { type: String, required: true },
      description: { type: String, default: "" },
    },
  },
});

const PlaylistsSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true }, 
  etag: {type: String, required : true, unique: true},
  playlists: { type: [PlaylistSchema], default: [] }, 
});

const Playlists = mongoose.model("Playlists", PlaylistsSchema);

export default Playlists;
