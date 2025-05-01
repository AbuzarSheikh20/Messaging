import multer from 'multer'
import { ApiError } from '../utills/ApiError.js'
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    },
})

export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype.startsWith('image/') ||
            file.mimetype.startsWith('video/') ||
            file.mimetype.startsWith('audio/') ||
            file.mimetype === 'application/pdf'
        ) {
            cb(null, true)
        } else {
            cb(new ApiError(400, 'Unsupported file format'), false)
        }
    },
})
