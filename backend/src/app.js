
/*
 * Configures the main Express application for RentHub.
 * Registers security, request parsing, logging and API routes.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import propertyRoutes from "./routes/property.routes.js";
import favouriteRoutes from "./routes/favourite.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import inquiryRoutes from "./routes/inquiry.routes.js";

import notFoundMiddleware from "./middleware/not-found.middleware.js";
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

// Apply security headers.
app.use(helmet());

// Allow requests from the Angular frontend.
app.use(
  cors({
    origin: env.clientUrl,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse incoming request bodies.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Log incoming requests during development.
if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
}

// Register API routes.
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/favourites", favouriteRoutes);
app.use("/api", commentRoutes);
app.use("/api", inquiryRoutes);

// Handle unknown routes and application errors.
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
