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
exports.createPlaylist = exports.getPlaylist = void 0;
const googleapis_1 = require("googleapis");
const playlists_1 = __importDefault(require("../../model/playlists"));
const getPlaylist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { session } = req.body;
        if (!(session === null || session === void 0 ? void 0 : session.accessToken)) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        const playlists = yield playlists_1.default.findOne({ userEmail: session.user.email });
        if (!playlists) {
            const youtube = googleapis_1.google.youtube({
                version: 'v3',
                auth: process.env.GOOGLE_API_KEY,
                headers: {
                    Authorization: `Bearer ${session.accessToken}`
                }
            });
            // Fetch latest playlists from YouTube API
            const response = yield youtube.playlists.list({
                part: ['snippet'],
                mine: true,
                maxResults: 100,
            });
            // Create new playlists if they don't exist
            const newPlaylists = yield playlists_1.default.create({
                userEmail: session.user.email,
                etag: response.data.etag,
                playlists: response.data.items
            });
            res.status(201).json({
                message: "Playlists created successfully",
                data: newPlaylists
            });
        }
        res.status(200).json({
            message: "Fetched all playlists",
            data: playlists
        });
        return;
    }
    catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
        return;
    }
});
exports.getPlaylist = getPlaylist;
const createPlaylist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { session } = req.body;
        if (!session.accessToken) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }
        if (!process.env.GOOGLE_API_KEY) {
            res.status(500).json({ error: "Google API key not configured" });
            return;
        }
        const youtube = googleapis_1.google.youtube({
            version: 'v3',
            auth: process.env.GOOGLE_API_KEY,
            headers: {
                Authorization: `Bearer ${session.accessToken}`
            }
        });
        // Fetch latest playlists from YouTube API
        const response = yield youtube.playlists.list({
            part: ['snippet'],
            mine: true,
            maxResults: 100,
        });
        // Check if playlists exist for this user
        const existingPlaylists = yield playlists_1.default.findOne({ userEmail: session.user.email });
        if (existingPlaylists) {
            // Update existing playlists
            const updatedPlaylists = yield playlists_1.default.findOneAndUpdate({ userEmail: session.user.email }, {
                etag: response.data.etag,
                playlists: response.data.items
            }, { new: true } // Return the updated document
            );
            res.status(200).json({
                message: "Playlists updated successfully",
                playlists: updatedPlaylists
            });
            return;
        }
        // Create new playlists if they don't exist
        const newPlaylists = yield playlists_1.default.create({
            userEmail: session.user.email,
            etag: response.data.etag,
            playlists: response.data.items
        });
        res.status(201).json({
            message: "Playlists created successfully",
            data: newPlaylists
        });
        return;
    }
    catch (err) {
        console.error("Error managing playlists:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
        return;
    }
});
exports.createPlaylist = createPlaylist;
