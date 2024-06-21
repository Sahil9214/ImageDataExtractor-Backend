const express = require("express");
const multer = require("multer");
const { exiftool } = require("exiftool-vendored");
const { MetadataModel } = require("./model/Image.model");
const { connection } = require("./db");
const fs = require("fs").promises;
const cors = require("cors");
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

connection
  .then(() => {
    console.log("Connected to MongoDB");

    app.post("/upload", upload.single("image"), async (req, res) => {
      const filePath = req.file.path;
      console.log("**********filePath**********", filePath);

      try {
        const metadata = await exiftool.read(filePath);

        const newMetadata = new MetadataModel({
          name: req.file.originalname,
          lastModifiedDate: metadata.ModifyDate
            ? new Date(metadata.ModifyDate)
            : new Date(),
          size: req.file.size,
          type: req.file.mimetype,
          location: metadata.GPSPosition || "Unknown",
          byte: req.file.size,
          tags: metadata,
        });

        await newMetadata.save();

        await fs.unlink(filePath);

        res.status(200).send("File uploaded and metadata saved successfully");
      } catch (error) {
        console.error("Error processing file:", error);

        await fs
          .unlink(filePath)
          .catch((err) =>
            console.error(`Error deleting file: ${filePath}`, err)
          );

        res.status(500).json({ error: "Error processing file" });
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
