const express = require("express");
const multer = require("multer");
const { exiftool } = require("exiftool-vendored");
const { MetadataModel } = require("./model/Image.model");
const { connection } = require("./db");
const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");
const cors = require("cors");
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });
const parser = new xml2js.Parser();

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

connection
  .then(() => {
    console.log("Connected to MongoDB");

    app.post("/upload", upload.single("image"), async (req, res) => {
      const filePath = req.file.path;
      const xmlDirectoryPath = "path/to/xml/files"; // Update to your actual XML directory path

      try {
        // Extract metadata using exiftool
        const metadata = await exiftool.read(filePath);

        // Check if the metadata for this image already exists
        const existingMetadata = await MetadataModel.findOne({
          name: req.file.originalname,
        });

        if (existingMetadata) {
          res.status(400).json({
            message: "Metadata for this image already exists in the database.",
          });
        } else {
          // Save metadata to MongoDB
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

          // Check for corresponding XML file and process annotations
          const xmlFileName = `${path.parse(req.file.originalname).name}.xml`;
          console.log(xmlFileName, "***********************");
          const xmlFilePath = path.join(xmlDirectoryPath, xmlFileName);

          if (fs.existsSync(xmlFilePath)) {
            const xmlData = fs.readFileSync(xmlFilePath);
            const result = await parser.parseStringPromise(xmlData);

            // Extract annotations from the XML
            const annotations = result.annotation.object.map((obj) => ({
              x: parseInt(obj.bndbox.xmin[0]),
              y: parseInt(obj.bndbox.ymin[0]),
              width:
                parseInt(obj.bndbox.xmax[0]) - parseInt(obj.bndbox.xmin[0]),
              height:
                parseInt(obj.bndbox.ymax[0]) - parseInt(obj.bndbox.ymin[0]),
              content: obj.name[0],
            }));

            newMetadata.annotations = annotations;
            await newMetadata.save();

            res.status(200).json({
              message: "Metadata and annotations saved successfully.",
            });
          } else {
            res
              .status(404)
              .json({ message: "No corresponding XML file found." });
          }
        }

        // Clean up the uploaded file
        fs.unlink(filePath, (err) => {
          if (err) console.error(`Error deleting file: ${filePath}`, err);
        });
      } catch (error) {
        fs.unlink(filePath, (err) => {
          if (err) console.error(`Error deleting file: ${filePath}`, err);
        });
        res.status(500).send("Error processing file");
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
