const { exiftool } = require("exiftool-vendored");
const express = require("express");
const { MetadataModel } = require("./model/Image.model");
const { connection } = require("./db");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const axios = require("axios");
const xml2js = require("xml2js");
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

const xmlParser = new xml2js.Parser();

connection
  .then(() => {
    console.log("Connected to MongoDB");

    app.post("/upload", upload.single("image"), async (req, res) => {
      const filePath = req.file ? req.file.path : null;
      try {
        let metadata;
        let annotations = [];

        const fileName = req.file ? req.file.originalname : req.body.url;

        // Check if a document with the same name already exists
        const existingMetadata = await MetadataModel.findOne({
          name: fileName,
        });
        if (existingMetadata) {
          return res
            .status(400)
            .send("File with the same name already exists.");
        }

        if (filePath) {
          metadata = await exiftool.read(filePath);
        } else if (req.body.url) {
          const response = await axios.get(req.body.url, {
            responseType: "arraybuffer",
          });
          const buffer = Buffer.from(response.data, "binary");
          fs.writeFileSync("tempImage", buffer);
          metadata = await exiftool.read("tempImage");
          fs.unlinkSync("tempImage");
        }

        if (!metadata) {
          return res.status(400).send("No image or URL provided");
        }

        // Read XML file for annotations
        const xmlFilePath = `./xmlFile/${fileName}.xml`; // adjust the path as needed
        if (fs.existsSync(xmlFilePath)) {
          const xmlData = fs.readFileSync(xmlFilePath, "utf-8");
          const parsedXml = await xmlParser.parseStringPromise(xmlData);

          // Extract annotation data from XML
          annotations = parsedXml.annotation.object.map((obj) => ({
            name: obj.name[0],
            bndbox: {
              xmin: parseInt(obj.bndbox[0].xmin[0]),
              ymin: parseInt(obj.bndbox[0].ymin[0]),
              xmax: parseInt(obj.bndbox[0].xmax[0]),
              ymax: parseInt(obj.bndbox[0].ymax[0]),
            },
            height: parseInt(obj.size[0].height[0]),
            width: parseInt(obj.size[0].width[0]),
          }));
        }

        const newMetadata = new MetadataModel({
          name: fileName,
          lastModifiedDate: req.file ? req.file.lastModifiedDate : new Date(),
          size: req.file ? req.file.size : response.headers["content-length"],
          type: req.file ? req.file.mimetype : response.headers["content-type"],
          location: metadata.GPSPosition || "Unknown",
          byte: req.file ? req.file.size : response.headers["content-length"],
          tags: metadata,
          annotations: annotations,
        });

        await newMetadata.save();

        res.json(metadata);
      } catch (error) {
        res.status(500).send("Error extracting metadata");
      } finally {
        if (filePath) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error("Failed to delete temporary file", err);
            }
          });
        }
      }
    });

    app.get("/metadata", async (req, res) => {
      try {
        const allMetadata = await MetadataModel.find({});
        res.json(allMetadata);
      } catch (error) {
        res.status(500).send("Error fetching metadata");
      }
    });

    app.listen(8080, () => {
      console.log("Server is running on port 8080");
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });
