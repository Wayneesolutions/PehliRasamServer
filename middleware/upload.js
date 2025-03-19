const multer = require("multer");
const multerS3 = require("multer-s3");
const fs = require("fs");
const path = require("path");
const s3 = require("../config/awsConfig");

const isProduction = process.env.NODE_ENV === "production";

// Allowed file types
const allowedMimeTypes = {
    images: ["image/jpeg", "image/png", "image/jpg"],
    videos: ["video/mp4", "video/mov", "video/avi"]
};

// File filter function
const fileFilter = (req, file, cb) => {
    if ([...allowedMimeTypes.images, ...allowedMimeTypes.videos].includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Allowed: JPG, PNG, MP4, MOV, AVI"), false);
    }
};

// Local storage configuration (for development)
const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = file.mimetype.startsWith("image/") ? "uploads/images" : "uploads/videos";
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// AWS S3 storage configuration (for production)
const s3Storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
        const folder = file.mimetype.startsWith("image/") ? "images" : "videos";
        cb(null, `${folder}/${Date.now()}-${file.originalname}`);
    }
});

// Select storage based on environment
const storage = isProduction ? s3Storage : localStorage;

// Multer upload configuration
const FileUpload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // Max 20MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") && file.size > 5 * 1024 * 1024) {
            return cb(new Error("Image size must be less than 5MB"), false);
        } else if (file.mimetype.startsWith("video/") && file.size > 20 * 1024 * 1024) {
            return cb(new Error("Video size must be less than 20MB"), false);
        }
        fileFilter(req, file, cb);
    }
});

module.exports = FileUpload;
