import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDirectory =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "uploads", "documents")
    : path.join(
        process.cwd(),
        "uploads",
        "documents"
      );

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (
    _req,
    _file,
    cb
  ) => {
    cb(null, uploadDirectory);
  },

  filename: (
    _req,
    file,
    cb
  ) => {
    const extension =
      path.extname(file.originalname);

    const uniqueName =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

    cb(null, uniqueName);
  },
});

const fileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  cb
) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  if (
    allowedTypes.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF, JPG, and PNG files are allowed"
      )
    );
  }
};

const upload = multer({
  storage,

  fileFilter,

  limits: {
    // 10 MB maximum
    fileSize: 10 * 1024 * 1024,
  },
});

export default upload;