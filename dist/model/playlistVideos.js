"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ThumbnailSchema = new mongoose_1.default.Schema({
    url: { type: String, required: true },
    width: { type: Number },
    height: { type: Number },
});
const ResourceSchema = new mongoose_1.default.Schema({
    kind: { type: String, required: true },
    videoId: { type: String, required: true },
});
const VideoSchema = new mongoose_1.default.Schema({
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
        channelTitle: { type: String },
        playlistId: { type: String, required: true },
        position: { type: Number, required: true },
        resourceId: ResourceSchema,
        videoOwnerChannelTitle: { type: String },
        videoOwnerChannelId: { type: String },
    },
});
const PlaylistSchema = new mongoose_1.default.Schema({
    userEmail: { type: String, required: true },
    playlistId: { type: String, required: true, unique: true },
    videos: [VideoSchema],
});
const PlaylistVideos = mongoose_1.default.model("PlaylistVideos", PlaylistSchema);
exports.default = PlaylistVideos;
