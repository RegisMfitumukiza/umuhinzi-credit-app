import { cloudinary } from "../config/cloudinary.js";
import { APIError } from "./ApiError.js";

type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

type UploadOptions = {
  folder?: string;
};

export const getListingCoverFolder = (listingId: string) => {
  return `airbnb-clone/listings/${listingId}/cover`;
};

export const getListingGalleryFolder = (listingId: string) => {
  return `airbnb-clone/listings/${listingId}/gallery`;
};

export const getUserAvatarFolder = () => {
  return "airbnb-clone/users/avatars";
};

export const uploadBufferToCloudinary = async (
  fileBuffer: Buffer,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> => {
  const folder = options.folder || "airbnb-clone/misc";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            new APIError("Failed to upload to Cloudinary", 400)
          );
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (
  publicId: string
): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};