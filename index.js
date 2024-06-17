const express = require("express");
const multer = require("multer");
const exiftool = require("exiftool-vendored").exiftool;
const { MetadataModel } = require("./model/Image.model");
const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const metadata = await exiftool.read(filePath);
    res.json(metadata);
  } catch (error) {
    res.status(500).send("Error extracting metadata");
  }
});

app.listen(process.env.PORT, () => {
  console.log("Server is running on port 3000");
});
