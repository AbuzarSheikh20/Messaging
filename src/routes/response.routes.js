import { authorizeRoles, JWTVerify } from '../middlewares/auth.middleware.js'
import { UserRoles } from '../constants.js'
import { Router } from 'express'
import { upload } from '../middlewares/multer.middleware.js'

import {
    createResponse,
    getMotivatorResponses,
    getResponseById,
} from '../controllers/response.controller.js'

const router = Router()

router
    .route('/')
    .post(
        JWTVerify,
        authorizeRoles(UserRoles.ADMIN, UserRoles.MOTIVATOR),
        upload.single('file'),
        createResponse
    )
router
    .route('/')
    .get(
        JWTVerify,
        authorizeRoles(UserRoles.ADMIN, UserRoles.MOTIVATOR),
        getMotivatorResponses
    )
router.route('/:id').get(JWTVerify, getResponseById)

export default router
