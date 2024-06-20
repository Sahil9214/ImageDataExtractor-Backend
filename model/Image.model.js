const mongoose = require("mongoose");

const annotationSchema = new mongoose.Schema({
  x: { type: Number, required: true }, // x-coordinate of the top-left corner
  y: { type: Number, required: true }, // y-coordinate of the top-left corner
  width: { type: Number, required: true }, // Width of the annotation box
  height: { type: Number, required: true }, // Height of the annotation box
  content: { type: String }, // Optional: Content inside the annotation
});

const metadataSchema = new mongoose.Schema({
  name: { type: String },
  lastModifiedDate: { type: Date },
  size: { type: mongoose.Schema.Types.Mixed }, // Size can be a number or string
  type: { type: String },
  location: { type: String },
  byte: { type: Number },
  tags: { type: mongoose.Schema.Types.Mixed }, // Flexible field for additional metadata
  annotations: [annotationSchema], // Array of annotation objects
});

const MetadataModel = mongoose.model("Metadata", metadataSchema);

module.exports = { MetadataModel };
