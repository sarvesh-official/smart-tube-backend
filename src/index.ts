import dotenv from "dotenv";
dotenv.config();

import express from "express";
import userRoute from "./routes/user.route";
import cors from "cors";
import { connectToDb } from "./utils/db";
import youtubeRoute from "./routes/youtube.route";

const app = express();
app.use(cors());
const port = process.env.PORT || 5000;

// Add these middleware to parse JSON and URL-encoded bodies
dotenv.config()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/youtube", youtubeRoute);
app.use("/api/user", userRoute);

// app.use("/api", (req, res) => {
//     res.send("Working!");
// });

app.listen(port, () => {
    connectToDb();
    console.log(`Server running on port ${port}`);
});