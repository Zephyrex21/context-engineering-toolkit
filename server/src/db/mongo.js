import mongoose from "mongoose";

let connectionState = "disabled"; // disabled | connecting | connected | error

export async function connectMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("[mongo] MONGO_URI not set — running without persistence.");
    connectionState = "disabled";
    return;
  }

  connectionState = "connecting";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    connectionState = "connected";
    console.log("[mongo] connected");
  } catch (err) {
    connectionState = "error";
    console.error("[mongo] connection failed — continuing without persistence:", err.message);
  }
}

export function getMongoStatus() {
  return connectionState;
}

export function isMongoReady() {
  return connectionState === "connected";
}
