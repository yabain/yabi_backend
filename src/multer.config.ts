/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as path from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: './assets/images', // Dossier où les fichiers seront stockés
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
      callback(null, filename);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
};

// Configuration for Multer to handle file uploads
export const multerConfigForUser = {
  storage: diskStorage({
    destination: './assets/images',
    filename: (req: any, file, callback) => {
      const userId = req.user._id;
      const fileExt = path.extname(file.originalname);
      const fileName = `pictureFile_${userId}${fileExt}`;
      callback(null, fileName);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
};

// Configuration for Multer to handle file uploads
export const multerConfigForEvent = {
  storage: diskStorage({
    destination: './assets/images',
    filename: (req, file, callback) => {
      const fileExt = path.extname(file.originalname);
      const fileName = `eventCoverFile_${req.params.id}${fileExt}`;
      callback(null, fileName);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
};
