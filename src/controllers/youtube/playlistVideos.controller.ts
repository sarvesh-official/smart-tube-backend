import { Request, Response } from "express";
import Playlist from "../../model/playlist";
import { google } from 'googleapis';

export const getPlaylistVideos = async (req: Request, res: Response) => {
    try {
        const { playlistId, session } = req.body;

        if (!session?.accessToken) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }

        if (!playlistId) {
            res.status(400).json({ error: "Playlist ID is required" });
            return;
        }

        let playlist = await Playlist.findOne({ 
            userEmail: session.user.email, 
            playlistId: playlistId 
        });

        if (!playlist) {
            try {
                const youtube = google.youtube({
                    version: 'v3',
                    auth: process.env.GOOGLE_API_KEY,
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`
                    }
                });

                const response = await youtube.playlistItems.list({
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
                playlist = await Playlist.create({
                    userEmail: session.user.email,
                    playlistId: playlistId,
                    videos: response.data.items
                });

            } catch (error: any) {
                // Handle YouTube API errors
                if (error.response?.status === 404) {
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

    } catch (err) {
        console.error("Error fetching playlist videos:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
        return;
    }
}

export const getAllPlaylistVideos = async (req: Request, res: Response) => {
    try {
        const { session } = req.body;

        if (!session?.accessToken) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }

        // Fetch all playlists for the user
        const playlists = await Playlist.find({ userEmail: session.user.email });

        if (!playlists || playlists.length === 0) {
            res.status(404).json({ message: "No playlists found" });
            return;
        }

        // Flatten all videos into a single array
        const allVideos = playlists.flatMap(playlist => 
            playlist.videos.map((video: any) => ({
                videoId: video.snippet.resourceId.videoId,
                title: video.snippet.title,
                description: video.snippet.description,
                thumbnail: video.snippet.thumbnails || {},
                playlistId: playlist.playlistId,
                publishedAt: video.snippet.publishedAt
            }))
        );

        res.status(200).json({
            message: "Fetched all videos successfully",
            data: allVideos  // Now returning a single array of all videos
        });

    } catch (err) {
        console.error("Error fetching all videos:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
    }
};

export const createPlaylistVideos = async (req: Request, res: Response) => {
    try {
        const { playlistId, session } = req.body;

        if (!session?.accessToken) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }

        if (!playlistId) {
            res.status(400).json({ error: "Playlist ID is required" });
            return;
        }

        const youtube = google.youtube({
            version: 'v3',
            auth: process.env.GOOGLE_API_KEY,
            headers: {
                Authorization: `Bearer ${session.accessToken}`
            }
        });

        const response = await youtube.playlistItems.list({
            part: ['snippet'],
            playlistId: playlistId,
            maxResults: 50
        });

        const existingPlaylist = await Playlist.findOne({ 
            userEmail: session.user.email, 
            playlistId: playlistId 
        });

        if (existingPlaylist) {
            const updatedPlaylist = await Playlist.findOneAndUpdate(
                { 
                    userEmail: session.user.email, 
                    playlistId: playlistId 
                },
                { videos: response.data.items },
                { new: true }
            );

            res.status(200).json({
                message: "Playlist videos updated successfully",
                data: updatedPlaylist
            });
            return;
        }

        const newPlaylist = await Playlist.create({
            userEmail: session.user.email,
            playlistId: playlistId,
            videos: response.data.items
        });

        res.status(201).json({
            message: "Playlist videos created successfully",
            data: newPlaylist
        });
        return;

    } catch (err: any) {
        console.error("Error managing playlist videos:", err);
        
        if (err.response?.status === 404) {
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
}
