import fs from "fs";
import path from "path";
import winston from "winston";

const logsDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
};

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),

  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error"
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log")
    })
  ]
});
