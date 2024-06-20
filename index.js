const { exiftool } = require("exiftool-vendored");
const { MetadataModel } = require("./model/Image.model");
const { connection } = require("./db");
const cors = require("cors");
const fs = require("fs");
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
      try {
        const metadata = await exiftool.read(filePath);

        const newMetadata = new MetadataModel({
          name: req.file.originalname,
          lastModifiedDate: req.file.lastModifiedDate,
          size: req.file.size,
          type: req.file.mimetype,
          location: metadata.GPSPosition || "Unknown",
          byte: req.file.size,
          tags: metadata,
        });

        await newMetadata.save();

        res.json(metadata);
      } catch (error) {
        res.status(500).send("Error extracting metadata");
      } finally {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Failed to delete temporary file", err);
          }
        });
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
