const mongoose = require('mongoose');

const IRSOrgSchema = new mongoose.Schema({
  ein: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  street: String,
  city: String,
  state: String,
  zip: String,
  nteeCode: String,
  deductibility: String,
  status: String,
  classification: String,
  foundation: String,
  subsection: String,
  affiliation: String,
  ruling: String,
  activity: String,
  organization: String,
  sortName: String,
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('IRSOrg', IRSOrgSchema);