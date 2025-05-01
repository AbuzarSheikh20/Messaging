import { User } from '../models/user.model.js'
import { UserStatus, UserRoles } from '../constants.js'
import { asyncHandler } from '../utills/asyncHandler.js'
import { ApiError } from '../utills/ApiError.js'
import { ApiResponse } from '../utills/ApiResponce.js'

const getAllUsers = asyncHandler(async (req, res) => {
    const userRole = req.user.role

    if (userRole !== UserRoles.ADMIN) {
        throw new ApiError(403, 'Only Admin can view all users')
    }

    const users = await User.find().select('-password -refreshToken')
    return res
        .status(200)
        .json(new ApiResponse(200, users, 'Users retrieved succesfully'))
})

const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params
    const requestingUserId = req.user._id
    const userRole = req.user.role

    if (userRole !== UserRoles.ADMIN && id !== requestingUserId.toString()) {
        // uses toString() -> bcz mongoDB return objectID and params gives strings
        throw new ApiError(403, "You don't have permission to view this user")
    }

    const user = await User.findById(id).select('-password -refreshToken')

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    res.status(200).json(
        new ApiResponse(200, user, 'User retrieved successfully')
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const user = await User.findById(userId).select('-password -refreshToken')

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'User retrieved successfully'))
})

const updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params
    const userRole = req.user.role
    const { status } = req.body

    if (userRole !== UserRoles.ADMIN) {
        throw new ApiError(
            403,
            "You don't have permission to update user's status"
        )
    }

    if (!Object.values(UserStatus).includes(status)) {
        throw new ApiError(400, 'Invalid access')
    }

    const user = User.findById(id)

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    user.status = status
    await user.save()

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Updated user status successfully'))
})

const approveMotivator = asyncHandler(async (req, res) => {
    const { id } = req.params
    const userRole = req.user.role

    if (userRole !== UserRoles.ADMIN) {
        throw new ApiError(
            403,
            "You don't have permission to approve motivators"
        )
    }

    const user = await User.findById(id)

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    if (user.role !== UserRoles.MOTIVATOR) {
        throw new ApiError(400, 'User is not a motivator')
    }

    if (user.status === UserStatus.ACTIVE) {
        if (!user) {
            throw new ApiError(400, 'Motivator has been already approved')
        }
    }

    user.status = UserStatus.ACTIVE
    await user.save()

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Approved motivator successfully'))
})

const rejectMotivator = asyncHandler(async (req, res) => {
    const { id } = req.params
    const userRole = req.user.role

    if (userRole !== UserRoles.ADMIN) {
        throw new ApiError(
            403,
            "You don't have permission to approve motivators"
        )
    }

    const user = await User.findById(id)

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    if (user.role !== UserRoles.MOTIVATOR) {
        throw new ApiError(400, 'User is not a motivator')
    }

    user.status = UserStatus.INACTIVE
    await user.save()

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Approved motivator successfully'))
})

export {
    getAllUsers,
    getUserById,
    getCurrentUser,
    updateUserStatus,
    approveMotivator,
    rejectMotivator,
}
