const app = require("./app");
const env = require("./config/env");
const mongoose = require("mongoose");
const connectDatabase = require("./config/database");

async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`CS MARCHE is running on port ${env.PORT}`);
    });

    let shuttingDown = false;
    const shutdown = (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`${signal} received. Closing server...`);

      server.close(async (error) => {
        if (error) console.error("HTTP server shutdown error:", error);
        try {
          await mongoose.disconnect();
          process.exit(error ? 1 : 0);
        } catch (disconnectError) {
          console.error("Database shutdown error:", disconnectError.message);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error("Graceful shutdown timed out.");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start the application:", error.message);
    process.exit(1);
  }
}

startServer();
