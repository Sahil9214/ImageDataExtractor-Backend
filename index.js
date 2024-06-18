const express = require("express");
const multer = require("multer");
const { exiftool } = require("exiftool-vendored");
const { MetadataModel } = require("./model/Image.model");
const { connection } = require("./db");
require("dotenv").config();
const cors = require("cors");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors()); // Correctly enabling CORS middleware

// Wait for the database connection to establish before starting the server
connection
  .then(() => {
    console.log("Connected to MongoDB");

    app.post("/upload", upload.single("image"), async (req, res) => {
      const filePath = req.file.path;
      try {
        const metadata = await exiftool.read(filePath);

        const newMetadata = new MetadataModel({
          tags: metadata,
          sourceFile: filePath,
        });

        await newMetadata.save();

        // Clean up the uploaded file
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${filePath}`, err);
          }
        });

        res.json(metadata);
      } catch (error) {
        // Clean up the uploaded file in case of error
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${filePath}`, err);
          }
        });
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
