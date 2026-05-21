import multer from "multer";
import { APIError } from "../utils/ApiError.js";

const storage = multer.memoryStorage();

export const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new APIError("Only images are allowed", 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export const uploadSingleImage = upload.single("image");
export const uploadMultipleImages = upload.array("images", 10);

export default upload;