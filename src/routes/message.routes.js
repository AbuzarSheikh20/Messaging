import { authorizeRoles, JWTVerify } from '../middlewares/auth.middleware.js'
import { UserRoles } from '../constants.js'
import { Router } from 'express'
import { upload } from '../middlewares/multer.middleware.js'

import {
    createMessage,
    getMessageById,
    getUserMessages,
    updateMessageStatus,
} from '../controllers/message.controller.js'

const router = Router()

router.route('/').post(JWTVerify, upload.single('file'), createMessage)
router.route('/user-messages').get(JWTVerify, getUserMessages)
router.route('/:id').get(JWTVerify, getMessageById)
router
    .route('/:id/status')
    .get(
        JWTVerify,
        authorizeRoles(UserRoles.ADMIN, UserRoles.MOTIVATOR),
        updateMessageStatus
    )

export default router
