import express, { Router } from 'express'
import { registerUser } from '../controllers/auth.controller.js'

import { upload } from '../middlewares/multer.middleware.js'

const router = Router()

router.route('/register').post(upload.single('profilePhoto'), registerUser)

export default router
