import mongoose from "mongoose";

export const connectToDb = async () => {
  try {
    const url = process.env.DATABASE_URL || " ";

    await mongoose.connect(url);

    console.log("✅ MongoDB Connected Successfully");
  } catch (error: any) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1); // Exit process on failure
  }
};
