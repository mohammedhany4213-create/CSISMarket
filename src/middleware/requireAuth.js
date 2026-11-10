const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.cs_marche_token;
    if (!token) return res.status(401).json({ success: false, message: "Please log in to continue." });
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id name email phone whatsapp bio");
    if (!user) return res.status(401).json({ success: false, message: "Your session is no longer valid." });
    req.user = user;
    next();
  } catch {
    res.clearCookie("cs_marche_token", { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", path: "/" });
    return res.status(401).json({ success: false, message: "Please log in again." });
  }
}

module.exports = requireAuth;
