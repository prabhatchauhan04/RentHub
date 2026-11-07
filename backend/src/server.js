
/*
 * Starts the RentHub Express server.
 * Listens for incoming HTTP requests on the configured port.
 */

import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

// Open and warm the connection pool before accepting requests.
try {
  await Promise.all(
    Array.from({ length: 4 }, () => prisma.$queryRaw`SELECT 1`)
  );
} catch (error) {
  console.error("Database warm-up failed:", error.message);
}

// Start the Express server.
app.listen(env.port, () => {
  console.log(`RentHub API running on http://localhost:${env.port}`);
  console.log(`Environment: ${env.nodeEnv}`);
});
