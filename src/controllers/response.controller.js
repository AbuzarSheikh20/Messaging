import { asyncHandler } from '../utills/asyncHandler.js'
import { ApiError } from '../utills/ApiError.js'
import { ApiResponse } from '../utills/ApiResponce.js'
import { User } from '../models/user.model.js'
import { Message } from '../models/message.model.js'
import { Response } from '../models/response.model.js'
import { MessageStatus } from '../constants.js'
import { uploadOnCloudinary } from '../utills/cloudinary.js'

const createResponse = asyncHandler(async (req, res) => {
    const { content, messageId } = req.body
    const motivatorId = req.user._id
    const userRole = req.user.role

    if (userRole !== 'motivator' && userRole !== 'admin') {
        throw new ApiError(403, "You don't have permission to make responses")
    }

    if (!content) {
        throw new ApiError(400, 'Content is required')
    }
    if (!messageId) {
        throw new ApiError(400, 'Message Id is required')
    }

    const message = await Message.findById(messageId)
    if (!message) {
        throw new ApiError(400, 'Message not found')
    }

    if (message.hasResponse) {
        throw new ApiError(400, 'Message already had a response')
    }

    if (userRole === 'motivator') {
        const motivator = await User.findById(motivatorId)
        const user = await User.findById(message.userId)

        if (user.gender !== motivator.gender) {
            throw new ApiError(
                400,
                'You can only respond mesages from user of your gender'
            )
        }
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
        messageId,
        motivatorId,
        fileUrl,
    })

    message.response = response._id
    message.hasResponse = true
    message.status = MessageStatus.RESPONDED
    await message.save()

    return res
        .status(200)
        .json(new ApiResponse(200, response, 'Response create successfully'))
})

const getMotivatorResponses = asyncHandler(async (req, res) => {
    const motivatorId = req.user._id
    const userRole = req.user.role

    if (userRole !== 'motivator' && userRole !== 'admin') {
        throw new ApiError(403, "You don't have permission to view responses")
    }

    let responses = []
    if (userRole === 'motivator') {
        responses = await Response.find({ motivatorId })
            .populate('messageId')
            .sort({ createdAt: -1 })
    } else if (userRole === 'admin') {
        responses = await Response.find({ motivatorId })
            .populate('messageId')
            .populate('motivatorId', 'name email')
            .sort({ createdAt: -1 })
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, responses, 'Responses retrieved successfully')
        )
})

const getResponseById = asyncHandler(async (req, res) => {
    const { id } = req.params
    const userId = req.user._id
    const userRole = req.user.role

    const response = await Response.findById(id)
        .populate('messageId')
        .populate('motivatorId', 'name email')
        .sort({ createdAt: -1 })

    if (!response) {
        throw new ApiError(403, 'Responses not found')
    }

    if (userRole === 'client') {
        const message = await User.findById(response.messageId)

        if (message.userId.toString() !== userId.toString()) {
            throw new ApiError(
                403,
                "You don't have Permission to view this response"
            )
        }
    } else if (userRole === 'motivator') {
        if (response.messageId.toString() !== userId.toString()) {
            throw new ApiError(
                403,
                "You don't have Permission to view this response"
            )
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(200, response, 'Response retrieved successfully'))
})

export { createResponse, getMotivatorResponses, getResponseById }
