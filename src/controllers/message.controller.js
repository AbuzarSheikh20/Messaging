import { asyncHandler } from '../utills/asyncHandler.js'
import { ApiError } from '../utills/ApiError.js'
import { ApiResponse } from '../utills/ApiResponce.js'
import { User } from '../models/user.model.js'
import { Message } from '../models/message.model.js'
import { MessageStatus } from '../constants.js'
import { uploadOnCloudinary } from '../utills/cloudinary.js'

const createMessage = asyncHandler(async (req, res) => {
    const { content } = req.body
    const userId = req.user._id

    if (!content) {
        throw new ApiError(400, 'Content is required')
    }

    let fileUrl
    if (req.file) {
        const uploadedFile = await uploadOnCloudinary(req.file.path)
        if (!uploadedFile) {
            throw new ApiError(400, 'File not found')
        }
        fileUrl = uploadedFile.url
    }

    const response = await Message.create({
        content,
        userId,
        fileUrl,
        status: MessageStatus.NEW,
    })

    return res
        .status(200)
        .json(new ApiResponse(200, response, 'Message create successfully'))
})

const getUserMessages = asyncHandler(async (req, res) => {
    const userRole = req.user.role
    const userId = req.user._id

    let messages = []
    if (userRole === 'client') {
        messages = await Message.find({ userId })
            .populate('response')
            .sort({ createdAt: -1 })
    } else if (userRole === 'motivator') {
        messages = await Message.find({ userId })
        const motivator = await User.findById(userId)
        const motivatorGender = motivator.gender

        const users = await User.find({
            role: 'client',
            gender: motivatorGender,
        })

        const userIds = users.map((user) => user._id)

        messages = await Message.find({
            userId: { $in: userIds },
            $or: [
                {
                    status: MessageStatus.NEW,
                    response: { $exists: true, $ne: null },
                },
            ],
        })
            .populate('response')
            .sort({ createdAt: -1 })
    } else if (userRole === 'admin') {
        messages = await Message.find()
            .populate('response')
            .sort({ createdAt: -1 })
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, messages, 'Responses retrieved successfully')
        )
})

const getMessageById = asyncHandler(async (req, res) => {
    const { id } = req.params
    const userId = req.user._id
    const userRole = req.user.role

    const message = await Message.findById(id).populate('response')

    if (!message) {
        throw new ApiError(404, 'Message not found')
    }

    if (
        userRole === 'client' &&
        message.userId.toString() !== userId.toString()
    ) {
        throw new ApiError(
            403,
            "You don't have Permission to view this Message"
        )
    }

    if (userRole === 'motivator') {
        const motivator = await User.findById(userId)
        const user = await User.findById(message.userId)

        if (user.gender !== motivator.gender) {
            throw new ApiError(
                403,
                "You don't have Permission to view this Message"
            )
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200, message, 'Messages retrieved successfully'))
})

const updateMessageStatus = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { status } = req.body
    const userRole = req.user.role

    if (userRole !== 'motivator' && userRole !== 'admin') {
        throw new ApiError(
            403,
            "You don't have Permission to update message status"
        )
    }

    if (!Object.values(MessageStatus).includes(status)) {
        throw new ApiError(404, 'Invalid status')
    }

    const message = await Message.findById(id)

    if (!message) {
        throw new ApiError(404, 'Message not found')
    }

    message.status = status
    await message.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                message,
                'Messages status updated successfully'
            )
        )
})

export { createMessage, getUserMessages, getMessageById, updateMessageStatus }
