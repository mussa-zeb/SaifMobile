import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['mobile', 'perfume', 'headphone'],
      required: true,
    },
    listedPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    color: { type: String, default: '' },
    stock: { type: Number, default: 0, min: 0 },
    imei1: { type: String, default: '' },
    imei2: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' }, // Kept for backward compatibility
    images: { type: [String], default: [] }, // NEW: Array of images
  },
  { timestamps: true }
)

export default mongoose.models.Product || mongoose.model('Product', ProductSchema)