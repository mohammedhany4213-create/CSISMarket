const app = require("./app");
const env = require("./config/env");
const connectDatabase = require("./config/database");

async function startServer() {
  try {
    await connectDatabase();

    app.listen(env.PORT, () => {
      console.log(`CS MARCHE is running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the application:", error.message);
    process.exit(1);
  }
}

startServer();
