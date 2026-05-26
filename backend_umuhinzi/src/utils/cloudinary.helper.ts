import type { UploadApiResponse } from "cloudinary";

import { cloudinary } from "../config/cloudinary.js";
import { APIError } from "./ApiError.js";

type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

type UploadOptions = {
  folder?: string;
  publicId?: string;
};

/* =========================================================
   ROOT FOLDERS
========================================================= */

const APP_ROOT_FOLDER = "umuhinzi-app";

/* =========================================================
   USER
========================================================= */

export const getUserAvatarFolder = () =>
  `${APP_ROOT_FOLDER}/users/avatars`;

export const getUserVerificationFolder = (
  userId: string
) =>
  `${APP_ROOT_FOLDER}/users/${userId}/verification`;

/* =========================================================
   FARMERS
========================================================= */

export const getFarmerDocumentsFolder = (
  farmerId: string
) =>
  `${APP_ROOT_FOLDER}/farmers/${farmerId}/documents`;

export const getFarmerReportsFolder = (
  farmerId: string
) =>
  `${APP_ROOT_FOLDER}/farmers/${farmerId}/reports`;

/* =========================================================
   FARMS
========================================================= */

export const getFarmImagesFolder = (
  farmId: string
) =>
  `${APP_ROOT_FOLDER}/farms/${farmId}/images`;

export const getFarmDocumentsFolder = (
  farmId: string
) =>
  `${APP_ROOT_FOLDER}/farms/${farmId}/documents`;

/* =========================================================
   COOPERATIVES
========================================================= */

export const getCooperativeLogoFolder = (
  cooperativeId: string
) =>
  `${APP_ROOT_FOLDER}/cooperatives/${cooperativeId}/logo`;

export const getCooperativeDocumentsFolder = (
  cooperativeId: string
) =>
  `${APP_ROOT_FOLDER}/cooperatives/${cooperativeId}/documents`;

/* =========================================================
   INSTITUTIONS
========================================================= */

export const getInstitutionLogoFolder = (
  institutionId: string
) =>
  `${APP_ROOT_FOLDER}/institutions/${institutionId}/logo`;

export const getInstitutionDocumentsFolder = (
  institutionId: string
) =>
  `${APP_ROOT_FOLDER}/institutions/${institutionId}/documents`;

/* =========================================================
   LOANS
========================================================= */

export const getLoanDocumentsFolder = (
  loanId: string
) =>
  `${APP_ROOT_FOLDER}/loans/${loanId}/documents`;

/* =========================================================
   ANALYTICS / REPORTS
========================================================= */

export const getAnalyticsReportsFolder = () =>
  `${APP_ROOT_FOLDER}/analytics/reports`;

/* =========================================================
   GENERAL UPLOAD
========================================================= */

export const uploadBufferToCloudinary = async (
  fileBuffer: Buffer,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> => {
  const folder =
    options.folder ||
    `${APP_ROOT_FOLDER}/misc`;

  return new Promise((resolve, reject) => {
    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
          public_id: options.publicId,
        },

        (
          error,
          result?: UploadApiResponse
        ) => {
          if (error || !result) {
            return reject(
              new APIError(
                "Failed to upload file to Cloudinary",
                400
              )
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

/* =========================================================
   DELETE FILE
========================================================= */

export const deleteFromCloudinary = async (
  publicId: string
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(
      publicId
    );
  } catch {
    throw new APIError(
      "Failed to delete file from Cloudinary",
      400
    );
  }
};