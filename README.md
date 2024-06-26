# Image Data Extractor - Backend

This project provides the backend functionality for extracting image metadata and annotations. It works in conjunction with the frontend application, which you can find here.

## Features

- **Metadata Extraction**: Extracts relevant metadata from images.
- **Annotation Handling**: Manages annotations associated with images.
- **API Endpoints**:
  - `/api/images`: Retrieves image metadata.
  - `/api/annotations`: Handles image annotations.

## Tech Stack

- **Node.js**: Backend server environment.
- **Express.js**: Web framework for handling routes and requests.
- **MongoDB**: Database for storing image data.
- **Mongoose**: ODM library for MongoDB.
- **JWT Authentication**: Secure endpoints using JSON Web Tokens.

## Getting Started

1. Clone this repository.
2. Install dependencies using `npm install`.
3. Set up your MongoDB connection in `config.js`.
4. Run the server using `npm start`.

## API Endpoints

- `GET /metadata`: Retrieves image metadata.
- `POST /upload`: Adds an annotation to an image.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
