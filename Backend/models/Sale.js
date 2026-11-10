import mongoose from 'mongoose'

const SaleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  category: { type: String, required: true },
  imei1: { type: String, default: '' },
  imei2: { type: String, default: '' },
  color: { type: String, default: '' },
  costPrice: { type: Number, required: true },
  sellPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
}, { _id: false })

const SaleSchema = new mongoose.Schema(
  {
    items: { type: [SaleItemSchema], required: true },
    customer: {
      name: { type: String, required: true },
      address: { type: String, default: '' },
      cnic: { type: String, default: '' },
      number: { type: String, required: true },
    },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['completed', 'returned'], default: 'completed' },
  },
  { timestamps: true }
)

export default mongoose.models.Sale || mongoose.model('Sale', SaleSchema)