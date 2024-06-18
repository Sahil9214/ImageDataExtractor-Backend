const mongoose = require("mongoose");

const metadataSchema = new mongoose.Schema({
  name: { type: String },
  lastModifiedDate: { type: Date },
  size: { type: mongoose.Schema.Types.Mixed }, // Size can be a number or string
  type: { type: String },
  location: { type: String },
  byte: { type: Number },
  tags: { type: mongoose.Schema.Types.Mixed }, // Flexible field for additional metadata
});

const MetadataModel = mongoose.model("Metadata", metadataSchema);

module.exports = { MetadataModel };
