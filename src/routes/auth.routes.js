import { Router } from 'express'
import {
    changeCurrentPassword,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerMotivator,
    registerUser,
    updateProfilePhoto,
    updateUserDetails,
} from '../controllers/auth.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { JWTVerify } from '../middlewares/auth.middleware.js'

const router = Router()

router.route('/register-user').post(upload.single('profilePhoto'), registerUser)
router
    .route('/register-motivator')
    .post(upload.single('profilePhoto'), registerMotivator)
router.route('/login').post(loginUser)
router.route('/refresh-token').post(refreshAccessToken)

// Secured routes
router.route('/logout').post(JWTVerify, logoutUser)
router.route('/change-password').post(JWTVerify, changeCurrentPassword)
router.route('/update-details').post(JWTVerify, updateUserDetails)
router
    .route('/update-profile-photo')
    .post(JWTVerify,upload.single('profilePhoto'), updateProfilePhoto)

export default router
