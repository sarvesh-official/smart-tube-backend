"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const playlist_controller_1 = require("../controllers/youtube/playlist.controller");
const playlistVideos_controller_1 = require("../controllers/youtube/playlistVideos.controller");
const video_controller_1 = require("../controllers/youtube/video.controller");
const router = (0, express_1.Router)();
// Playlists Route
router.post("/getPlaylists", playlist_controller_1.getPlaylist);
router.post("/createPlaylists", playlist_controller_1.createPlaylist);
// Playlist Route
router.post("/getPlaylistVideos", playlistVideos_controller_1.getPlaylistVideos);
router.post("/getAllVideos", playlistVideos_controller_1.getAllPlaylistVideos);
router.post("/createPlaylistVideos", playlistVideos_controller_1.createPlaylistVideos);
// Get Video
router.post("/getVideo", video_controller_1.getVideoById);
exports.default = router;
