import mongoose from "mongoose"


export const connectToDb = async() => {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL is not defined");
        }
        mongoose.connect(process.env.DATABASE_URL);
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}