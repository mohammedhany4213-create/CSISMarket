const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.cs_marche_token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Please log in to continue." });
    }

    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.sub !== "string") {
      return res.status(401).json({ success: false, message: "Please log in again." });
    }

    const user = await User.findById(payload.sub)
      .select("_id name email phone whatsapp bio +tokenVersion");

    if (!user || payload.ver !== (user.tokenVersion || 0)) {
      return res.status(401).json({ success: false, message: "Your session is no longer valid." });
    }

    req.user = user;
    return next();
  } catch {
    res.clearCookie("cs_marche_token", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });
    return res.status(401).json({ success: false, message: "Please log in again." });
  }
}

module.exports = requireAuth;
