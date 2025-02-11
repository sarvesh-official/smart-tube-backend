import { Request, Response } from "express";
import Video from "../../model/video";
import { google } from "googleapis";

export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { videoId, session } = req.body;

    if (!session?.accessToken) {
        res.status(401).json({ error: "Not authenticated" });
      return 
    }

    if (!videoId) {
      res.status(400).json({ error: "Video ID is required" });
      return 
    }

    let video = await Video.findOne({ userEmail: session.user.email, videoId });

    if (!video) {
      try {

        const youtube = google.youtube({
          version: "v3",
          auth: process.env.GOOGLE_API_KEY,
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });

        const response = await youtube.videos.list({
          part: ["snippet"],
          id: [videoId],
        });

        if (!response.data.items || response.data.items.length === 0) {
            res.status(404).json({ error: "Invalid video ID" });
          return 
        }

        const videoData = response.data.items[0];
        
        if (!videoData?.snippet) {
            res.status(404).json({ error: "Video data is incomplete" });
            return 
        }

        video = await Video.findOneAndUpdate(
            { userEmail: session.user.email, videoId }, // Find existing entry
            {
              $set: {
                title: videoData.snippet.title,
                description: videoData.snippet.description,
                thumbnail: {
                  default: videoData.snippet.thumbnails?.default?.url,
                  medium: videoData.snippet.thumbnails?.medium?.url,
                  high: videoData.snippet.thumbnails?.high?.url,
                },
                url: `https://www.youtube.com/watch?v=${videoId}`,
                publishedAt: videoData.snippet.publishedAt,
              },
            },
            { upsert: true, new: true } // Create if not found, return updated doc
          );
      } catch (error: any) {
        if (error.response?.status === 404) {
            res.status(404).json({ error: "Invalid video ID" });
          return 
        }
        throw error;
      }
    }

    res.status(200).json({
      message: "Fetched video successfully",
      data: video,
    });
  } catch (err) {
    console.error("Error fetching video:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
