const argon2 = require("argon2");
const mongoose = require("mongoose");
const readline = require("node:readline");
const { Writable } = require("node:stream");
const env = require("../src/config/env");
const User = require("../src/models/User");

function ask(question) {
  return new Promise((resolve) => {
    const output = new Writable({
      write(_chunk, _encoding, callback) { callback(); }
    });
    const terminal = readline.createInterface({ input: process.stdin, output, terminal: true });
    process.stdout.write(question);
    terminal.question("", (answer) => {
      terminal.close();
      resolve(answer.trim());
    });
  });
}

function askHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
      reject(new Error("Run this command in an interactive terminal."));
      return;
    }

    let value = "";
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
      process.stdout.write("\n");
    };

    const onData = (chunk) => {
      for (const char of chunk.toString("utf8")) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("Cancelled."));
          return;
        }
        if (char === "\r" || char === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        if (char >= " " && char <= "~") value += char;
      }
    };

    process.stdin.on("data", onData);
  });
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npm run admin:reset-password -- <user-email>");
    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(env.MONGODB_URI);
    const user = await User.findOne({ email }).select("_id email");
    if (!user) throw new Error("No account was found with that email.");

    const password = await askHidden("New password (minimum 8 characters): ");
    if (password.length < 8 || password.length > 128) {
      throw new Error("Password must contain between 8 and 128 characters.");
    }

    const passwordHash = await argon2.hash(password);
    await User.updateOne(
      { _id: user._id },
      { $set: { passwordHash }, $inc: { tokenVersion: 1 } }
    );

    console.log("Password updated. All existing sessions for this account have been revoked.");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Password reset failed:", error.message);
  process.exitCode = 1;
});
