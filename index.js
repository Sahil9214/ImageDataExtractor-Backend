const express = require("express");
const multer = require("multer");
const { exiftool } = require("exiftool-vendored");
const { MetadataModel } = require("./model/Image.model");
const { connection } = require("./db");
const fs = require("fs").promises;
const cors = require("cors");
const xml2js = require("xml2js");
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
      const imageName = req.file.originalname;
      const xmlFolderPath = "path/to/xml/files"; // Change this to your XML folder path

      try {
        // Check if a file with the same name is already saved
        const existingMetadata = await MetadataModel.findOne({
          name: imageName,
        });
        if (existingMetadata) {
          await fs.unlink(filePath);
          return res.status(400).json({ error: "This file is already saved" });
        }

        // Extract metadata using exiftool
        const metadata = await exiftool.read(filePath);

        // Find the corresponding XML file
        const xmlFileName = `${xmlFolderPath}/${imageName.split(".")[0]}.xml`;
        const xmlData = await fs.readFile(xmlFileName, "utf8");

        // Parse XML file
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xmlData);

        // Extract annotation data
        const annotation = result.annotation;
        const objects = annotation.object.map((obj) => ({
          name: obj.name[0],
          pose: obj.pose[0],
          truncated: obj.truncated[0],
          difficult: obj.difficult[0],
          bndbox: {
            xmin: parseInt(obj.bndbox[0].xmin[0], 10),
            ymin: parseInt(obj.bndbox[0].ymin[0], 10),
            xmax: parseInt(obj.bndbox[0].xmax[0], 10),
            ymax: parseInt(obj.bndbox[0].ymax[0], 10),
          },
        }));

        const newMetadata = new MetadataModel({
          name: imageName,
          lastModifiedDate: metadata.ModifyDate
            ? new Date(metadata.ModifyDate)
            : new Date(),
          size: req.file.size,
          type: req.file.mimetype,
          location: metadata.GPSPosition || "Unknown",
          byte: req.file.size,
          tags: metadata,
          annotation: {
            folder: annotation.folder[0],
            filename: annotation.filename[0],
            path: annotation.path[0],
            source: annotation.source[0].database[0],
            size: {
              width: parseInt(annotation.size[0].width[0], 10),
              height: parseInt(annotation.size[0].height[0], 10),
              depth: parseInt(annotation.size[0].depth[0], 10),
            },
            segmented: parseInt(annotation.segmented[0], 10),
            objects: objects,
          },
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

    app.get("/metadata", async (req, res) => {
      try {
        const allMetadata = await MetadataModel.find({});
        res.status(200).json(allMetadata);
      } catch (error) {
        res.status(500).json({ error });
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
