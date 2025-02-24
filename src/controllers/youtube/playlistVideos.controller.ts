import { Request, Response } from "express";
import { google } from 'googleapis';
import PlaylistVideos from "../../model/playlistVideos";

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

        let playlist = await PlaylistVideos.findOne({ 
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
                playlist = await PlaylistVideos.create({
                    userEmail: session.user.email,
                    playlistId: playlistId,
                    videos: response.data.items
                });

            } catch (error: any) {
                if (error.response?.status === 404) {
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

        let playlists = await PlaylistVideos.find({ userEmail: session.user.email });

        // If no playlists are found, fetch them from YouTube
        if (!playlists || playlists.length === 0) {
            try {
                const youtube = google.youtube({
                    version: 'v3',
                    auth: process.env.GOOGLE_API_KEY,
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`
                    }
                });

                // Fetch user's playlists
                const response = await youtube.playlists.list({
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
                    await PlaylistVideos.findOneAndUpdate(
                        { userEmail: session.user.email, playlistId: playlist.id },
                        { $setOnInsert: { videos: [] } },
                        { upsert: true, new: true }
                    );
                }

                playlists = await PlaylistVideos.find({ userEmail: session.user.email });

            } catch (error: any) {
                console.error("Error fetching user's playlists:", error);
                res.status(500).json({ message: "Error fetching playlists", error: error.message });
                return;
            }
        }

        const youtube = google.youtube({
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
                    const videoResponse = await youtube.playlistItems.list({
                        part: ['snippet'],
                        playlistId: playlist.playlistId,
                        maxResults: 50
                    });

                    if (videoResponse.data.items && videoResponse.data.items.length > 0) {
                        await PlaylistVideos.findOneAndUpdate(
                            { userEmail: session.user.email, playlistId: playlist.playlistId },
                            { videos: videoResponse.data.items }
                        );
                    }
                } catch (error) {
                    console.warn(`Failed to fetch videos for playlist ${playlist.playlistId}`, error);
                }
            }
        }

        // Fetch updated playlists
        playlists = await PlaylistVideos.find({ userEmail: session.user.email });

        const allVideos = playlists.flatMap((playlist) =>
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
            data: allVideos
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

        const existingPlaylist = await PlaylistVideos.findOne({ 
            userEmail: session.user.email, 
            playlistId: playlistId 
        });

        if (existingPlaylist) {
            const updatedPlaylist = await PlaylistVideos.findOneAndUpdate(
                { userEmail: session.user.email, playlistId: playlistId },
                { videos: response.data.items },
                { new: true }
            );

            res.status(200).json({
                message: "Playlist videos updated successfully",
                data: updatedPlaylist
            });
            return;
        }

        const newPlaylist = await PlaylistVideos.findOneAndUpdate(
            { userEmail: session.user.email, playlistId: playlistId },
            { videos: response.data.items },
            { upsert: true, new: true }
        );

        res.status(201).json({
            message: "Playlist videos created successfully",
            data: newPlaylist
        });
        return;

    } catch (err: any) {
        console.error("Error managing playlist videos:", err);
        
        if (err.response?.status === 404) {
            res.status(404).json({ error: "Invalid playlist ID" });
            return;
        }

        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
        return;
    }
}

export const searchVideos = async (req : Request, res : Response) => {
    try {
        const { query, session } = req.body;

        if (!session?.accessToken) {
            res.status(401).json({ error: "Not authenticated" });
            return 
        }
        if (!query) {
            res.status(400).json({ error: "Search query is required" });
            return 
        }
        const userEmail = session.user.email;

        // **1️⃣ Find Exact Title Matches**
        const exactMatches = await PlaylistVideos.aggregate([
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

        const textMatches = await PlaylistVideos.aggregate([
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

    } catch (err) {
        console.error("Error searching videos:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
        return ;
    }
};