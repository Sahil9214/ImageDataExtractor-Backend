const mongoose = require("mongoose");

const metadataSchema = new mongoose.Schema({
  tags: Object,
  sourceFile: String,
});

const MetadataModel = mongoose.model("Metadata", metadataSchema);

module.exports = { MetadataModel };
