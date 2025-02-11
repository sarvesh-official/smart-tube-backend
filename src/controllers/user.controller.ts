import { Request, Response } from "express";
import User from "../model/user";

export const createUser = async (req: Request, res: Response) => {
    const { name, email, image, accessToken } = req.body;

    // Validate required fields
    if (!email || !name) {
        res.status(400).json({ message: "Email and name are required" });
        return; 
    }

    try {
        // Use findOne instead of find to get a single user
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            res.status(409).json({ message: "User already exists" });
            return; 
        }

        const newUser = await User.create({
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

    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
        return; 
    }
}

export const getUser = async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        
        const user = await User.findOne({ email });
        
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return; 
        }

        res.status(200).json({ user });
        return 

    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : "Unknown error"
        });
        return;
    }
}