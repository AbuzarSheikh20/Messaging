import { User } from '../models/user.model.js'
import { ApiError } from '../utills/ApiError.js'
import { asyncHandler } from '../utills/asyncHandler.js'
import jwt from 'jsonwebtoken'

export const JWTVerify = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header('Authorization')?.replace('Bearer ', '')

        if (!token) {
            throw new ApiError(401, 'Unauthorized request')
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select(
            '-password -refreshToken'
        )

        if (!user) {
            throw new ApiError(401, 'Invalid Access token')
        }

        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid access token')
    }
})

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new ApiError(
                403,
                "You don't have access to use this resource"
            )
        }
        next()
    }
}
