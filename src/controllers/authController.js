const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const User = require("../models/User");
const env = require("../config/env");
const { isAllowedStudentEmail } = require("../utils/studentEmail");

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(20).optional().default(""),
  whatsapp: z.string().trim().max(20).optional().default("")
});
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128) });

function getSessionMaxAge(value) {
  if (typeof value === "number") return value * 1000;
  const match = /^(\d+)(s|m|h|d)$/i.exec(String(value));
  if (!match) return 24 * 60 * 60 * 1000;
  const units = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return Number(match[1]) * units[match[2].toLowerCase()];
}

function setSession(res, user) {
  const token = jwt.sign({ sub: user.id, ver: user.tokenVersion || 0 }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  res.cookie("cs_marche_token", token, {
    httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax",
    maxAge: getSessionMaxAge(env.JWT_EXPIRES_IN), path: "/"
  });
}

exports.register = async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "Check the form fields and try again.", errors: parsed.error.flatten().fieldErrors });
  const data = parsed.data;
  if (!isAllowedStudentEmail(data.email, env.ALLOWED_EMAIL_DOMAINS)) return res.status(400).json({ success: false, message: "Use an email address from the approved student domain." });
  const exists = await User.exists({ email: data.email.toLowerCase() });
  if (exists) return res.status(400).json({ success: false, message: "Unable to create an account with these details." });
  const passwordHash = await argon2.hash(data.password);
  const user = await User.create({ name: data.name, email: data.email, passwordHash, phone: data.phone, whatsapp: data.whatsapp });
  setSession(res, user);
  res.status(201).json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
};

exports.login = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "Enter a valid email and password." });
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+passwordHash +tokenVersion");
  if (!user || !(await argon2.verify(user.passwordHash, parsed.data.password))) {
    return res.status(401).json({ success: false, message: "Email or password is incorrect." });
  }
  setSession(res, user);
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
};

exports.logout = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { $inc: { tokenVersion: 1 } });
  res.clearCookie("cs_marche_token", { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  res.json({ success: true, message: "You have been logged out." });
};

exports.me = (req, res) => res.json({ success: true, user: { id: req.user.id, name: req.user.name, email: req.user.email, phone: req.user.phone, whatsapp: req.user.whatsapp, bio: req.user.bio } });

exports.updateProfile = async (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(60),
    phone: z.string().trim().max(20).optional().default(""),
    whatsapp: z.string().trim().max(20).optional().default(""),
    bio: z.string().trim().max(240).optional().default("")
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "Please check your profile details.", errors: parsed.error.flatten().fieldErrors });
  const user = await User.findByIdAndUpdate(req.user.id, parsed.data, { new: true, runValidators: true }).select("_id name email phone whatsapp bio");
  res.json({ success: true, user });
};
