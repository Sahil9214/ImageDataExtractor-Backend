const express = require("express");
const multer = require("multer");
const { exiftool } = require("exiftool-vendored");
const { MetadataModel } = require("./model/Image.model");
const { connection } = require("./db");
require("dotenv").config();
const cors = require("cors");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// Wait for the database connection to establish before starting the server
connection
  .then(() => {
    console.log("Connected to MongoDB");

    app.post("/upload", upload.single("image"), async (req, res) => {
      try {
        const filePath = req.file.path;
        const metadata = await exiftool.read(filePath);

        // Save metadata to MongoDB
        const newMetadata = new MetadataModel({
          tags: metadata,
          sourceFile: filePath,
        });

        await newMetadata.save();

        res.json(metadata);
      } catch (error) {
        res.status(500).send("Error extracting metadata");
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB:", err);
  });
