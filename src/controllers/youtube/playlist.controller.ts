import { Request, Response } from "express";
import { google } from 'googleapis';
import Playlists from "../../model/playlists";

export const getPlaylist = async (req: Request, res: Response) => {
    try {
       
        const {session} = req.body;

        if (!session?.accessToken) {
            res.status(401).json({ error: "Not authenticated" });
            return 
        }

        const playlists = await Playlists.findOne({userEmail : session.user.email});

        if(!playlists) {
            const youtube = google.youtube({
                version: 'v3',
                auth: process.env.GOOGLE_API_KEY,
                headers: {
                    Authorization: `Bearer ${session.accessToken}`
                }
            });

            // Fetch latest playlists from YouTube API
        const response = await youtube.playlists.list({
            part: ['snippet'],
            mine: true,
            maxResults: 100,
        });


         // Create new playlists if they don't exist
         const newPlaylists = await Playlists.create({
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
            message : "Fetched all playlists",
            data : playlists
        })
        return;

    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
        return;
    }
}



export const createPlaylist = async (req: Request, res: Response) => {
    try {
        const {session} = req.body;

        if (!session.accessToken) {
            res.status(401).json({ error: "Not authenticated" });
            return;
        }

        if (!process.env.GOOGLE_API_KEY) {
            res.status(500).json({ error: "Google API key not configured" });
            return;
        }

        const youtube = google.youtube({
            version: 'v3',
            auth: process.env.GOOGLE_API_KEY,
            headers: {
                Authorization: `Bearer ${session.accessToken}`
            }
        });

        // Fetch latest playlists from YouTube API
        const response = await youtube.playlists.list({
            part: ['snippet'],
            mine: true,
            maxResults: 100,
        });

        // Check if playlists exist for this user
        const existingPlaylists = await Playlists.findOne({ userEmail: session.user.email });
        
        if (existingPlaylists) {
            // Update existing playlists
            const updatedPlaylists = await Playlists.findOneAndUpdate(
                { userEmail: session.user.email },
                {
                    etag: response.data.etag,
                    playlists: response.data.items
                },
                { new: true } // Return the updated document
            );

            res.status(200).json({
                message: "Playlists updated successfully",
                playlists: updatedPlaylists
            });
            return;
        }

        // Create new playlists if they don't exist
        const newPlaylists = await Playlists.create({
            userEmail: session.user.email,
            etag: response.data.etag,
            playlists: response.data.items
        });
            
        res.status(201).json({
            message: "Playlists created successfully",
            data: newPlaylists
        });
        return;

    } catch (err) {
        console.error("Error managing playlists:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
        return;
    }
}