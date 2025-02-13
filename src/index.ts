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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/youtube", youtubeRoute);
app.use("/api/user", userRoute);

app.get("/api", (req, res) => {
    res.send("Working!");
});

connectToDb().then(() => {
    app.listen(port, () => {
        console.log(`✅ Server running on port ${port}`);
    });
}).catch(err => {
    console.error("❌ Database connection failed:", err);
    process.exit(1); // Stop the process if DB connection fails
});
