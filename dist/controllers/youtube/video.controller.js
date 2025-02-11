"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoById = void 0;
const video_1 = __importDefault(require("../../model/video"));
const googleapis_1 = require("googleapis");
const getVideoById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const { videoId, session } = req.body;
        if (!(session === null || session === void 0 ? void 0 : session.accessToken)) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        if (!videoId) {
            res.status(400).json({ error: "Video ID is required" });
            return;
        }
        let video = yield video_1.default.findOne({ userEmail: session.user.email, videoId });
        if (!video) {
            try {
                const youtube = googleapis_1.google.youtube({
                    version: "v3",
                    auth: process.env.GOOGLE_API_KEY,
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                });
                const response = yield youtube.videos.list({
                    part: ["snippet"],
                    id: [videoId],
                });
                if (!response.data.items || response.data.items.length === 0) {
                    res.status(404).json({ error: "Invalid video ID" });
                    return;
                }
                const videoData = response.data.items[0];
                if (!(videoData === null || videoData === void 0 ? void 0 : videoData.snippet)) {
                    res.status(404).json({ error: "Video data is incomplete" });
                    return;
                }
                video = yield video_1.default.findOneAndUpdate({ userEmail: session.user.email, videoId }, // Find existing entry
                {
                    $set: {
                        title: videoData.snippet.title,
                        description: videoData.snippet.description,
                        thumbnail: {
                            default: (_b = (_a = videoData.snippet.thumbnails) === null || _a === void 0 ? void 0 : _a.default) === null || _b === void 0 ? void 0 : _b.url,
                            medium: (_d = (_c = videoData.snippet.thumbnails) === null || _c === void 0 ? void 0 : _c.medium) === null || _d === void 0 ? void 0 : _d.url,
                            high: (_f = (_e = videoData.snippet.thumbnails) === null || _e === void 0 ? void 0 : _e.high) === null || _f === void 0 ? void 0 : _f.url,
                        },
                        url: `https://www.youtube.com/watch?v=${videoId}`,
                        publishedAt: videoData.snippet.publishedAt,
                    },
                }, { upsert: true, new: true } // Create if not found, return updated doc
                );
            }
            catch (error) {
                if (((_g = error.response) === null || _g === void 0 ? void 0 : _g.status) === 404) {
                    res.status(404).json({ error: "Invalid video ID" });
                    return;
                }
                throw error;
            }
        }
        res.status(200).json({
            message: "Fetched video successfully",
            data: video,
        });
    }
    catch (err) {
        console.error("Error fetching video:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
});
exports.getVideoById = getVideoById;
