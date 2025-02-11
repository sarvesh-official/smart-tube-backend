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
exports.createPlaylistVideos = exports.getAllPlaylistVideos = exports.getPlaylistVideos = void 0;
const playlist_1 = __importDefault(require("../../model/playlist"));
const googleapis_1 = require("googleapis");
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
        let playlist = yield playlist_1.default.findOne({
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
                    playlistId: playlistId,
                    maxResults: 50
                });
                if (!response.data.items || response.data.items.length === 0) {
                    res.status(404).json({
                        error: "Invalid playlist ID or empty playlist"
                    });
                    return;
                }
                // Create new playlist in database
                playlist = yield playlist_1.default.create({
                    userEmail: session.user.email,
                    playlistId: playlistId,
                    videos: response.data.items
                });
            }
            catch (error) {
                // Handle YouTube API errors
                if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
                    res.status(404).json({
                        error: "Invalid playlist ID"
                    });
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
        // Fetch all playlists for the user
        const playlists = yield playlist_1.default.find({ userEmail: session.user.email });
        if (!playlists || playlists.length === 0) {
            res.status(404).json({ message: "No playlists found" });
            return;
        }
        // Flatten all videos into a single array
        const allVideos = playlists.flatMap(playlist => playlist.videos.map((video) => ({
            videoId: video.snippet.resourceId.videoId,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail: video.snippet.thumbnails || {},
            playlistId: playlist.playlistId,
            publishedAt: video.snippet.publishedAt
        })));
        res.status(200).json({
            message: "Fetched all videos successfully",
            data: allVideos // Now returning a single array of all videos
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
        const existingPlaylist = yield playlist_1.default.findOne({
            userEmail: session.user.email,
            playlistId: playlistId
        });
        if (existingPlaylist) {
            const updatedPlaylist = yield playlist_1.default.findOneAndUpdate({
                userEmail: session.user.email,
                playlistId: playlistId
            }, { videos: response.data.items }, { new: true });
            res.status(200).json({
                message: "Playlist videos updated successfully",
                data: updatedPlaylist
            });
            return;
        }
        const newPlaylist = yield playlist_1.default.create({
            userEmail: session.user.email,
            playlistId: playlistId,
            videos: response.data.items
        });
        res.status(201).json({
            message: "Playlist videos created successfully",
            data: newPlaylist
        });
        return;
    }
    catch (err) {
        console.error("Error managing playlist videos:", err);
        if (((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
            res.status(404).json({
                error: "Invalid playlist ID"
            });
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
