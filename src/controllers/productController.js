const { z } = require("zod");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

const productSchema = z.object({
  title: z.string().trim().min(3).max(90),
  description: z.string().trim().min(10).max(2000),
  price: z.coerce.number().min(0).max(100000000),
  category: z.enum(["Books", "Electronics", "Accessories", "Study tools", "Other"]),
  condition: z.enum(["New", "Like new", "Good", "Fair"]),
  imageUrl: z.union([z.literal(""), z.string().url().max(1000).refine((value) => value.startsWith("https://"), "Image URL must use HTTPS.")]).optional().default("")
});

exports.list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(24, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
  const filter = { isAvailable: true };
  if (req.query.category && ["Books", "Electronics", "Accessories", "Study tools", "Other"].includes(req.query.category)) filter.category = req.query.category;
  if (req.query.q?.trim()) filter.$text = { $search: req.query.q.trim().slice(0, 80) };
  const [items, total] = await Promise.all([
    Product.find(filter).populate("seller", "name").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter)
  ]);
  res.json({ success: true, items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.getOne = asyncHandler(async (req, res) => {
  const item = await Product.findById(req.params.id).populate("seller", "name bio").lean();
  if (!item || !item.isAvailable) return res.status(404).json({ success: false, message: "This listing is no longer available." });
  res.json({ success: true, item });
});

exports.create = asyncHandler(async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "Please check the listing details.", errors: parsed.error.flatten().fieldErrors });
  const item = await Product.create({ ...parsed.data, seller: req.user.id });
  res.status(201).json({ success: true, item });
});

exports.update = asyncHandler(async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "Please check the listing details.", errors: parsed.error.flatten().fieldErrors });
  const item = await Product.findOneAndUpdate({ _id: req.params.id, seller: req.user.id }, parsed.data, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ success: false, message: "Listing not found or you don't own it." });
  res.json({ success: true, item });
});

exports.remove = asyncHandler(async (req, res) => {
  const item = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user.id });
  if (!item) return res.status(404).json({ success: false, message: "Listing not found or you don't own it." });
  res.json({ success: true, message: "Listing deleted." });
});

exports.mine = asyncHandler(async (req, res) => {
  const items = await Product.find({ seller: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, items });
});

exports.contact = asyncHandler(async (req, res) => {
  const item = await Product.findById(req.params.id).select("seller isAvailable").lean();
  if (!item || !item.isAvailable) return res.status(404).json({ success: false, message: "This listing is no longer available." });
  const seller = await require("../models/User").findById(item.seller).select("phone whatsapp").lean();
  if (!seller) return res.status(404).json({ success: false, message: "Seller not found." });
  const normalize = require("../utils/phone").normalizeWhatsAppNumber;
  const whatsapp = normalize(seller.whatsapp || seller.phone);
  res.json({ success: true, contact: { whatsappUrl: whatsapp ? "https://wa.me/" + whatsapp : null } });
});

exports.setAvailability = asyncHandler(async (req, res) => {
  const parsed = z.object({ isAvailable: z.boolean() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "Availability must be true or false." });
  const item = await Product.findOneAndUpdate(
    { _id: req.params.id, seller: req.user.id },
    { isAvailable: parsed.data.isAvailable },
    { new: true, runValidators: true }
  ).select("_id isAvailable");
  if (!item) return res.status(404).json({ success: false, message: "Listing not found or you don't own it." });
  res.json({ success: true, item });
});
