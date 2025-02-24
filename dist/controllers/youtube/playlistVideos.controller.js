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
exports.searchVideos = exports.createPlaylistVideos = exports.getAllPlaylistVideos = exports.getPlaylistVideos = void 0;
const googleapis_1 = require("googleapis");
const playlistVideos_1 = __importDefault(require("../../model/playlistVideos"));
const getPlaylistVideos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { playlistId, session } = req.body;
        if (!(session === null || session === void 0 ? void 0 : session.accessToken)) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        if (!playlistId) {
            res.status(400).json({ error: "Playlist ID is required" });
            return;
        }
        let playlist = yield playlistVideos_1.default.findOne({
            userEmail: session.user.email,
            playlistId: playlistId
        });
        if (!playlist) {
            try {
                const youtube = googleapis_1.google.youtube({
                    version: 'v3',
                    auth: process.env.GOOGLE_API_KEY,
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`
                    }
                });
                const response = yield youtube.playlistItems.list({
                    part: ['snippet'],
                    playlistId: playlistId === "WL" ? "WL" : playlistId, // Support Watch Later
                    maxResults: 50
                });
                if (!response.data.items || response.data.items.length === 0) {
                    res.status(404).json({
                        error: "Invalid playlist ID or empty playlist"
                    });
                    return;
                }
                // Create new playlist in database
                playlist = yield playlistVideos_1.default.create({
                    userEmail: session.user.email,
                    playlistId: playlistId,
                    videos: response.data.items
                });
            }
            catch (error) {
                if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
                    res.status(404).json({ error: "Invalid playlist ID" });
                    return;
                }
                throw error;
            }
        }
        res.status(200).json({
            message: "Fetched playlist videos successfully",
            data: playlist
        });
        return;
    }
    catch (err) {
        console.error("Error fetching playlist videos:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
        return;
    }
});
exports.getPlaylistVideos = getPlaylistVideos;
const getAllPlaylistVideos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { session } = req.body;
        if (!(session === null || session === void 0 ? void 0 : session.accessToken)) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        let playlists = yield playlistVideos_1.default.find({ userEmail: session.user.email });
        // If no playlists are found, fetch them from YouTube
        if (!playlists || playlists.length === 0) {
            try {
                const youtube = googleapis_1.google.youtube({
                    version: 'v3',
                    auth: process.env.GOOGLE_API_KEY,
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`
                    }
                });
                // Fetch user's playlists
                const response = yield youtube.playlists.list({
                    part: ['snippet'],
                    mine: true,
                    maxResults: 50
                });
                if (!response.data.items || response.data.items.length === 0) {
                    res.status(404).json({ message: "No playlists found" });
                    return;
                }
                // Store playlists in DB
                for (const playlist of response.data.items) {
                    yield playlistVideos_1.default.findOneAndUpdate({ userEmail: session.user.email, playlistId: playlist.id }, { $setOnInsert: { videos: [] } }, { upsert: true, new: true });
                }
                playlists = yield playlistVideos_1.default.find({ userEmail: session.user.email });
            }
            catch (error) {
                console.error("Error fetching user's playlists:", error);
                res.status(500).json({ message: "Error fetching playlists", error: error.message });
                return;
            }
        }
        const youtube = googleapis_1.google.youtube({
            version: 'v3',
            auth: process.env.GOOGLE_API_KEY,
            headers: {
                Authorization: `Bearer ${session.accessToken}`
            }
        });
        // Fetch videos for playlists with no videos
        for (const playlist of playlists) {
            if (!playlist.videos || playlist.videos.length === 0) {
                try {
                    const videoResponse = yield youtube.playlistItems.list({
                        part: ['snippet'],
                        playlistId: playlist.playlistId,
                        maxResults: 50
                    });
                    if (videoResponse.data.items && videoResponse.data.items.length > 0) {
                        yield playlistVideos_1.default.findOneAndUpdate({ userEmail: session.user.email, playlistId: playlist.playlistId }, { videos: videoResponse.data.items });
                    }
                }
                catch (error) {
                    console.warn(`Failed to fetch videos for playlist ${playlist.playlistId}`, error);
                }
            }
        }
        // Fetch updated playlists
        playlists = yield playlistVideos_1.default.find({ userEmail: session.user.email });
        const allVideos = playlists.flatMap((playlist) => playlist.videos.map((video) => ({
            videoId: video.snippet.resourceId.videoId,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail: video.snippet.thumbnails || {},
            playlistId: playlist.playlistId,
            publishedAt: video.snippet.publishedAt
        })));
        res.status(200).json({
            message: "Fetched all videos successfully",
            data: allVideos
        });
    }
    catch (err) {
        console.error("Error fetching all videos:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
    }
});
exports.getAllPlaylistVideos = getAllPlaylistVideos;
const createPlaylistVideos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { playlistId, session } = req.body;
        if (!(session === null || session === void 0 ? void 0 : session.accessToken)) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        if (!playlistId) {
            res.status(400).json({ error: "Playlist ID is required" });
            return;
        }
        const youtube = googleapis_1.google.youtube({
            version: 'v3',
            auth: process.env.GOOGLE_API_KEY,
            headers: {
                Authorization: `Bearer ${session.accessToken}`
            }
        });
        const response = yield youtube.playlistItems.list({
            part: ['snippet'],
            playlistId: playlistId,
            maxResults: 50
        });
        const existingPlaylist = yield playlistVideos_1.default.findOne({
            userEmail: session.user.email,
            playlistId: playlistId
        });
        if (existingPlaylist) {
            const updatedPlaylist = yield playlistVideos_1.default.findOneAndUpdate({ userEmail: session.user.email, playlistId: playlistId }, { videos: response.data.items }, { new: true });
            res.status(200).json({
                message: "Playlist videos updated successfully",
                data: updatedPlaylist
            });
            return;
        }
        const newPlaylist = yield playlistVideos_1.default.findOneAndUpdate({ userEmail: session.user.email, playlistId: playlistId }, { videos: response.data.items }, { upsert: true, new: true });
        res.status(201).json({
            message: "Playlist videos created successfully",
            data: newPlaylist
        });
        return;
    }
    catch (err) {
        console.error("Error managing playlist videos:", err);
        if (((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
            res.status(404).json({ error: "Invalid playlist ID" });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
        return;
    }
});
exports.createPlaylistVideos = createPlaylistVideos;
const searchVideos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query, session } = req.body;
        if (!(session === null || session === void 0 ? void 0 : session.accessToken)) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        if (!query) {
            res.status(400).json({ error: "Search query is required" });
            return;
        }
        const userEmail = session.user.email;
        // **1️⃣ Find Exact Title Matches**
        const exactMatches = yield playlistVideos_1.default.aggregate([
            { $match: { userEmail } },
            { $unwind: "$videos" },
            {
                $match: {
                    "videos.snippet.title": {
                        $regex: `\\b${query}\\b`,
                        $options: "i"
                    }
                }
            },
            {
                $project: {
                    videoId: "$videos.snippet.resourceId.videoId",
                    title: "$videos.snippet.title",
                    description: "$videos.snippet.description",
                    thumbnail: "$videos.snippet.thumbnails",
                    playlistId: "$playlistId",
                    publishedAt: "$videos.snippet.publishedAt",
                    score: 1000
                }
            }
        ]);
        const textMatches = yield playlistVideos_1.default.aggregate([
            { $match: { userEmail, $text: { $search: query } } },
            { $unwind: "$videos" },
            {
                $project: {
                    videoId: "$videos.snippet.resourceId.videoId",
                    title: "$videos.snippet.title",
                    description: "$videos.snippet.description",
                    thumbnail: "$videos.snippet.thumbnails",
                    playlistId: "$playlistId",
                    publishedAt: "$videos.snippet.publishedAt",
                    score: { $meta: "textScore" }
                }
            },
            { $sort: { score: -1 } }
        ]);
        const combinedResults = [...exactMatches, ...textMatches];
        res.status(200).json({
            message: "Search results fetched successfully",
            data: combinedResults
        });
        return;
    }
    catch (err) {
        console.error("Error searching videos:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
        return;
    }
});
exports.searchVideos = searchVideos;
