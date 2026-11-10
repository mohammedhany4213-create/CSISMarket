const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const User = require("../models/User");
const env = require("../config/env");

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(20).optional().default(""),
  whatsapp: z.string().trim().max(20).optional().default("")
});
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128) });

function setSession(res, userId) {
  const token = jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  res.cookie("cs_marche_token", token, {
    httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, path: "/"
  });
}

exports.register = async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "Check the form fields and try again.", errors: parsed.error.flatten().fieldErrors });
  const data = parsed.data;
  const exists = await User.exists({ email: data.email.toLowerCase() });
  if (exists) return res.status(409).json({ success: false, message: "An account with this email already exists." });
  const passwordHash = await argon2.hash(data.password);
  const user = await User.create({ name: data.name, email: data.email, passwordHash, phone: data.phone, whatsapp: data.whatsapp });
  setSession(res, user.id);
  res.status(201).json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
};

exports.login = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "Enter a valid email and password." });
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+passwordHash");
  if (!user || !(await argon2.verify(user.passwordHash, parsed.data.password))) {
    return res.status(401).json({ success: false, message: "Email or password is incorrect." });
  }
  setSession(res, user.id);
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
};

exports.logout = (_req, res) => {
  res.clearCookie("cs_marche_token", { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  res.json({ success: true, message: "You have been logged out." });
};

exports.me = (req, res) => res.json({ success: true, user: req.user });
