import { Router } from "express";
import { getPlaylist, createPlaylist } from "../controllers/youtube/playlist.controller";
import { createPlaylistVideos, getAllPlaylistVideos, getPlaylistVideos, searchVideos } from "../controllers/youtube/playlistVideos.controller";
import { getVideoById } from "../controllers/youtube/video.controller";

const router = Router();


// Playlists Route
router.post("/getPlaylists",getPlaylist)
router.post("/createPlaylists",createPlaylist)

// Playlist Route
router.post("/getPlaylistVideos",getPlaylistVideos)
router.post("/getAllVideos",getAllPlaylistVideos)
router.post("/createPlaylistVideos",createPlaylistVideos)
// Get Video
router.post("/getVideo",getVideoById)
router.post("/search", searchVideos);

export default router;