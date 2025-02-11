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
exports.getUser = exports.createUser = void 0;
const user_1 = __importDefault(require("../model/user"));
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, image, accessToken } = req.body;
    // Validate required fields
    if (!email || !name) {
        res.status(400).json({ message: "Email and name are required" });
        return;
    }
    try {
        // Use findOne instead of find to get a single user
        const existingUser = yield user_1.default.findOne({ email: email });
        if (existingUser) {
            res.status(409).json({ message: "User already exists" });
            return;
        }
        const newUser = yield user_1.default.create({
            email,
            name,
            image,
            accessToken
        });
        res.status(201).json({
            message: "User created successfully",
            user: newUser
        });
        return;
    }
    catch (err) {
        console.error("Error creating user:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
        return;
    }
});
exports.createUser = createUser;
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.params;
        const user = yield user_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({ user });
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
exports.getUser = getUser;
