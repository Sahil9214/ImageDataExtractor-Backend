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
//****************************** */ !New Code ********************************************************************
//****************************** */ !New Code ********************************************************************
//****************************** */ !New Code ********************************************************************
// const express = require("express");
// const multer = require("multer");
// const { exiftool } = require("exiftool-vendored");
// const { MetadataModel, AnnotationModel } = require("./model/Image.model");
// const { connection } = require("./db");
// require("dotenv").config();
// const cors = require("cors");
// const fs = require("fs");
// const xml2js = require("xml2js");
// const parser = new xml2js.Parser();

// const app = express();
// const upload = multer({ dest: "uploads/" });

// app.use(express.json());
// app.use(cors());

// connection.then(() => {
//   console.log("Connected to MongoDB");

//   // Endpoint to handle image upload and metadata extraction
//   app.post("/upload", upload.single("image"), async (req, res) => {
//     const filePath = req.file.path;
//     try {
//       // Extract metadata using exiftool
//       const metadata = await exiftool.read(filePath);
//       const additionalMetadata = {
//         file_name: req.file.originalname,
//         file_size: req.file.size,
//         file_type: req.file.mimetype,
//         ...metadata,
//       };

//       // Create a new metadata document and save it to MongoDB
//       const newMetadata = new MetadataModel({
//         name: req.file.originalname,
//         lastModifiedDate: metadata.ModifyDate
//           ? new Date(metadata.ModifyDate)
//           : new Date(),
//         size: req.file.size,
//         type: req.file.mimetype,
//         location: metadata.GPSPosition || "Unknown",
//         byte: req.file.size,
//         tags: additionalMetadata,
//       });

//       await newMetadata.save();

//       // Check for corresponding XML file and process annotations
//       const xmlDirectoryPath =
//         "C:\\Users\\utkar\\OneDrive\\Desktop\\Meta-data-Backend\\xmlFile";
//       const xmlFileName = `${req.file.originalname}.xml`;
//       const xmlFilePath = path.join(xmlDirectoryPath, xmlFileName);

//       if (fs.existsSync(xmlFilePath)) {
//         const xmlData = fs.readFileSync(xmlFilePath);
//         const result = await parser.parseStringPromise(xmlData);
//         // Extract annotations from the result based on your XML structure
//         // ...

//         // Save new annotations to the database
//         const annotations = result.annotation.object.map((obj) => ({
//           x: obj.bndbox.xmin[0],
//           y: obj.bndbox.ymin[0],
//           width: obj.bndbox.xmax[0] - obj.bndbox.xmin[0],
//           height: obj.bndbox.ymax[0] - obj.bndbox.ymin[0],
//           content: obj.name[0],
//         }));

//         const newAnnotations = new AnnotationModel({
//           imageId: newMetadata._id,
//           annotations,
//         });

//         await newAnnotations.save();
//         res
//           .status(200)
//           .json({ message: "Metadata and annotations saved successfully." });
//       } else {
//         res.status(404).json({ message: "No corresponding XML file found." });
//       }

//       // Clean up the uploaded file
//       fs.unlink(filePath, (err) => {
//         if (err) {
//           console.error(`Error deleting file: ${filePath}`, err);
//         }
//       });
//     } catch (error) {
//       // Clean up the uploaded file in case of error
//       fs.unlink(filePath, (err) => {
//         if (err) {
//           console.error(`Error deleting file: ${filePath}`, err);
//         }
//       });
//       res.status(500).send("Error extracting metadata");
//     }
//   });

//   // ... other endpoints ...

//   const PORT = process.env.PORT || 3000;
//   app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
//   });
// });
