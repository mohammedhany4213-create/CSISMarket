const mongoose = require("mongoose");
const { z } = require("zod");
const Product = require("../models/Product");
const User = require("../models/User");
const { normalizeWhatsAppNumber } = require("../utils/phone");

const categories = ["Books", "Electronics", "Accessories", "Study tools", "Other"];
const productSchema = z.object({
  title: z.string().trim().min(3).max(90),
  description: z.string().trim().min(10).max(2000),
  price: z.coerce.number().finite().min(0).max(100000000),
  category: z.enum(categories),
  condition: z.enum(["New", "Like new", "Good", "Fair"]),
  imageUrl: z.union([
    z.literal(""),
    z.string().url().max(1000).refine((value) => value.startsWith("https://"), "Image URL must use HTTPS.")
  ]).optional().default("")
});

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function parsePositiveInteger(value, fallback, maximum) {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return null;
  return Math.min(parsed, maximum);
}

exports.list = async (req, res) => {
  const page = parsePositiveInteger(req.query.page, 1, 500);
  const limit = parsePositiveInteger(req.query.limit, 12, 24);

  if (page === null || limit === null ||
      (req.query.q !== undefined && typeof req.query.q !== "string") ||
      (req.query.category !== undefined && typeof req.query.category !== "string")) {
    return res.status(400).json({
      success: false,
      message: "Invalid search or pagination parameters."
    });
  }

  const rawQuery = (req.query.q || "").trim().slice(0, 80);
  const rawCategory = req.query.category || "";
  const filter = { isAvailable: true };

  if (categories.includes(rawCategory)) filter.category = rawCategory;
  if (rawQuery) filter.$text = { $search: rawQuery };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate("seller", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter)
  ]);

  res.json({
    success: true,
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
};

exports.getOne = async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid listing ID." });
  }
  const item = await Product.findById(req.params.id).populate("seller", "name bio").lean();
  if (!item || !item.isAvailable) {
    return res.status(404).json({ success: false, message: "This listing is no longer available." });
  }
  res.json({ success: true, item });
};

exports.create = async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Please check the listing details.",
      errors: parsed.error.flatten().fieldErrors
    });
  }
  const item = await Product.create({ ...parsed.data, seller: req.user.id });
  res.status(201).json({ success: true, item });
};

exports.update = async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid listing ID." });
  }
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Please check the listing details.",
      errors: parsed.error.flatten().fieldErrors
    });
  }
  const item = await Product.findOneAndUpdate(
    { _id: req.params.id, seller: req.user.id },
    parsed.data,
    { new: true, runValidators: true }
  );
  if (!item) {
    return res.status(404).json({ success: false, message: "Listing not found or you don't own it." });
  }
  res.json({ success: true, item });
};

exports.remove = async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid listing ID." });
  }
  const item = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user.id });
  if (!item) {
    return res.status(404).json({ success: false, message: "Listing not found or you don't own it." });
  }
  res.json({ success: true, message: "Listing deleted." });
};

exports.mine = async (req, res) => {
  const items = await Product.find({ seller: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, items });
};

exports.contact = async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid listing ID." });
  }
  const item = await Product.findById(req.params.id).select("seller isAvailable").lean();
  if (!item || !item.isAvailable) {
    return res.status(404).json({ success: false, message: "This listing is no longer available." });
  }

  const seller = await User.findById(item.seller).select("phone whatsapp").lean();
  if (!seller) return res.status(404).json({ success: false, message: "Seller not found." });

  const phone = String(seller.phone || "").replace(/[^\d+]/g, "");
  const whatsappNumber = normalizeWhatsAppNumber(seller.whatsapp || seller.phone);
  res.set("Cache-Control", "no-store");
  res.json({
    success: true,
    contact: {
      phone: /^\+?\d{8,15}$/.test(phone) ? phone : null,
      whatsappUrl: whatsappNumber ? "https://wa.me/" + whatsappNumber : null
    }
  });
};

exports.setAvailability = async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid listing ID." });
  }
  const parsed = z.object({ isAvailable: z.boolean() }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: "Availability must be true or false." });
  }
  const item = await Product.findOneAndUpdate(
    { _id: req.params.id, seller: req.user.id },
    { isAvailable: parsed.data.isAvailable },
    { new: true, runValidators: true }
  ).select("_id isAvailable");
  if (!item) {
    return res.status(404).json({ success: false, message: "Listing not found or you don't own it." });
  }
  res.json({ success: true, item });
};
