
/*
 * Defines health-check routes for the RentHub API.
 * Allows clients and deployment platforms to verify server availability.
 */

import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RentHub API is running.",
    timestamp: new Date().toISOString(),
  });
});

export default router;
