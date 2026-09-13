import multer from "multer";
import path from "path";
import fs from "fs";

// =========================================================
// UPLOAD DIRECTORY
// =========================================================
//
// Local:
//   backend/uploads/documents
//
// Vercel:
//   /tmp/uploads/documents
//
// Vercel does not allow us to create permanent files inside
// the deployed project directory, so we use /tmp in production.
//

const uploadDirectory =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "uploads", "documents")
    : path.join(
        process.cwd(),
        "uploads",
        "documents"
      );

// =========================================================
// CREATE DIRECTORY
// =========================================================

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

// =========================================================
// MULTER STORAGE
// =========================================================

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

// =========================================================
// FILE FILTER
// =========================================================

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

// =========================================================
// MULTER
// =========================================================

const upload = multer({
  storage,

  fileFilter,

  limits: {
    // 10 MB maximum
    fileSize: 10 * 1024 * 1024,
  },
});

// =========================================================
// EXPORT
// =========================================================

export default upload;