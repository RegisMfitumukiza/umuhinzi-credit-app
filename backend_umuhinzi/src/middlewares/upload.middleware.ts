import multer from "multer";
import { APIError } from "../utils/ApiError.js";

const storage = multer.memoryStorage();

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALL_ALLOWED_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  ...DOCUMENT_MIME_TYPES,
];

const createFileFilter =
  (allowedMimeTypes: string[], errorMessage: string) =>
  (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new APIError(errorMessage, 400));
  };

const imageUpload = multer({
  storage,
  fileFilter: createFileFilter(
    IMAGE_MIME_TYPES,
    "Only image files are allowed"
  ),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const documentUpload = multer({
  storage,
  fileFilter: createFileFilter(
    DOCUMENT_MIME_TYPES,
    "Only PDF or Word documents are allowed"
  ),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const mixedUpload = multer({
  storage,
  fileFilter: createFileFilter(
    ALL_ALLOWED_MIME_TYPES,
    "Only image, PDF, or Word files are allowed"
  ),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

/* ================= IMAGE UPLOADS ================= */

export const uploadSingleImage = imageUpload.single("image");

export const uploadMultipleImages = imageUpload.array("images", 10);

/* ================= DOCUMENT UPLOADS ================= */

export const uploadSingleDocument = documentUpload.single("document");

export const uploadMultipleDocuments = documentUpload.array("documents", 10);

/* ================= MIXED UPLOADS ================= */

export const uploadSingleFile = mixedUpload.single("file");

export const uploadMultipleFiles = mixedUpload.array("files", 10);

/* ================= SPECIFIC FIELD UPLOADS ================= */

export const uploadUserAvatar = imageUpload.single("avatar");

export const uploadFarmImages = imageUpload.array("images", 10);

export const uploadVerificationDocument =
  documentUpload.single("document");

export default mixedUpload;