"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./utils/db");
const youtube_route_1 = __importDefault(require("./routes/youtube.route"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const port = process.env.PORT || 5000;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api/youtube", youtube_route_1.default);
app.use("/api/user", user_route_1.default);
app.get("/api", (req, res) => {
    res.send("Working!");
});
(0, db_1.connectToDb)().then(() => {
    app.listen(port, () => {
        console.log(`✅ Server running on port ${port}`);
    });
}).catch(err => {
    console.error("❌ Database connection failed:", err);
    process.exit(1); // Stop the process if DB connection fails
});
