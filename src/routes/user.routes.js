import express, { Router } from 'express'
import {
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
} from '../controllers/auth.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { JWTVerify } from '../middlewares/auth.middleware.js'

const router = Router()

router.route('/register').post(upload.single('profilePhoto'), registerUser)
router.route('/login').post(loginUser)

// Secured routes
router.route('/logout').post(JWTVerify, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)

export default router
