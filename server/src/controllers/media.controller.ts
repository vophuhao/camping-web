/* eslint-disable no-undef */
import { catchErrors, ErrorFactory } from "@/errors";
import { ResponseUtil } from "../utils";
import { Request } from "express";
import { cloudinary } from "../config";
import { BAD_REQUEST } from "../constants/http";
import 'multer';
// Mở rộng type cho Request khi dùng Multer

export interface MulterRequest extends Request {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

export default class MediaController {
  // Hàm upload 1 file buffer lên Cloudinary
  uploadBufferToCloudinary = (file: Express.Multer.File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "tour",
          resource_type: "auto", // hỗ trợ cả ảnh & video
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Upload failed"));
          resolve(result.secure_url);
        }
      );

      stream.end(file.buffer);
    });
  };

  // Handler upload nhiều file
  saveMediaHandler = catchErrors(async (req, res) => {
    // Chuyển đổi files về mảng
    let filesArray: Express.Multer.File[] = [];

    if (Array.isArray(req.files)) {
      filesArray = (req as any).files;
    } else if (req.files && typeof req.files === "object") {
      filesArray = Object.values(req.files).flat();
    }

    if (!filesArray || filesArray.length === 0) {
      return res.status(BAD_REQUEST).json({ message: "Không có file nào được upload" });
    }

    try {
      const urls = await Promise.all(filesArray.map(this.uploadBufferToCloudinary));
      return ResponseUtil.success(res, urls);
    } catch (err) {
      throw ErrorFactory.invalidVerificationCode("Lỗi khi upload file"); // tạm thời dùng lỗi này
    }
  });
}
