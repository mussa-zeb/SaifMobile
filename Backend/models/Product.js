import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // "Model" in Excel
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
    ptaStatus: { type: String, default: '' },
    batteryHealth: { type: String, default: '' }, // NEW
    supplierName: { type: String, default: '' },
    supplierCnic: { type: String, default: '' },
    supplierContact: { type: String, default: '' },
    purchaseDate: { type: Date, default: Date.now },
    comments: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
)

export default mongoose.models.Product || mongoose.model('Product', ProductSchema)