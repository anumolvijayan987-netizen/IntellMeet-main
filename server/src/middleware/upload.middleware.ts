import multer from 'multer'
import { AppError } from '../utils/appError'

// In-memory buffer storage for avatars & attachments
const storage = multer.memoryStorage()

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(
      AppError.badRequest(
        `Unsupported file format: ${file.mimetype}. Allowed formats: JPEG, PNG, WEBP, GIF.`
      )
    )
  }
}

export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter,
})
