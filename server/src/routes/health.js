import { Router } from "express";
import { getMongoStatus } from "../db/mongo.js";

export const healthRouter = Router();

healthRouter.get("/", (req, res) => {
  res.json({
    status: "ok",
    uptime_seconds: Math.round(process.uptime()),
    mongo: getMongoStatus(),
  });
});
