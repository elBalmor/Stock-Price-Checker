const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true, index: true },
  likes: { type: Number, default: 0 },
  ipHashes: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Stock', StockSchema);
