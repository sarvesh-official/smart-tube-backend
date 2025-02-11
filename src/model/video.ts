import mongoose, { Schema, Document } from "mongoose";

interface IVideo extends Document {
  userEmail: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: {
    default?: string;
    medium?: string;
    high?: string;
  };
  url: string;
  publishedAt: Date;
  createdAt: Date;
}

const VideoSchema = new Schema<IVideo>(
  {
    userEmail: { type: String, required: true },
    videoId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    thumbnail: {
      default: { type: String },
      medium: { type: String },
      high: { type: String },
    },
    url: { type: String, required: true },
    publishedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const Video = mongoose.model<IVideo>("Video", VideoSchema);
export default Video;
