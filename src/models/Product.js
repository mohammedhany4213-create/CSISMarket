const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 90 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
  price: { type: Number, required: true, min: 0, max: 100000000 },
  category: { type: String, required: true, enum: ["Books", "Electronics", "Accessories", "Study tools", "Other"] },
  condition: { type: String, required: true, enum: ["New", "Like new", "Good", "Fair"] },
  imageUrl: { type: String, trim: true, default: "" },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  isAvailable: { type: Boolean, default: true, index: true }
}, { timestamps: true });

productSchema.index({ title: "text", description: "text" });
productSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);
