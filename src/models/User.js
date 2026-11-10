const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
  passwordHash: { type: String, required: true, select: false },
  phone: { type: String, trim: true, default: "", maxlength: 20 },
  whatsapp: { type: String, trim: true, default: "", maxlength: 20 },
  bio: { type: String, trim: true, default: "", maxlength: 240 },
  tokenVersion: { type: Number, default: 0, select: false }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
