import { asyncHandler } from '../utills/asyncHandler.js'
import { ApiError } from '../utills/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utills/cloudinary.js'
import { ApiResponse } from '../utills/ApiResponce.js'
import jwt from 'jsonwebtoken'

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({ validateBeforeSave: false })

        return { refreshToken, accessToken }
    } catch (error) {
        throw new ApiError(
            500,
            'Something went wrong while generating Access and Refresh Token'
        )
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user detail
    const {
        profilePhoto,
        gender,
        fullName,
        email,
        password,
        reason,
        experience,
        specialities,
    } = req.body

    // validation - not empty
    if ([email, password, gender].some((field) => field?.trim() === '')) {
        throw new ApiError(400, 'Required fileds are empty')
    }

    // existence of user - email
    const existedUser = await User.findOne({ email })
    if (existedUser) {
        throw new ApiError(409, 'User already Exists')
    }

    // check for images
    const profilePhotoLocalPath = req.file?.path
    console.log('profilePhoto Path', profilePhotoLocalPath)

    if (!profilePhotoLocalPath) {
        throw new ApiError(404, 'Profile Photo is not found')
    }

    // upload on cloudinary
    const uploadedImage = await uploadOnCloudinary(profilePhotoLocalPath)

    if (!uploadedImage) {
        throw new ApiError(404, 'Profile photo is required')
    }

    // create user
    const user = await User.create({
        fullName,
        email,
        password,
        profilePhoto: uploadedImage.url,
        gender,
        bio: req.body.bio || 'No bio provided',
        experience: req.body.experience || 'No experience provided',
        specialities: req.body.specialities || 'No specialities provided',
        reason: req.body.reason || 'No reason provided',
    })

    // rem pswd & ref token field from responce
    const createdUser = await User.findById(user._id).select(
        '-password -refreshToken'
    )

    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, 'Something went wrong while creating account')
    }

    // return res
    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, 'User registered succesfully'))
})

const loginUser = asyncHandler(async (req, res) => {
    // req.body
    // username & password - not empty
    // find user
    // check password
    // access & refresh token
    // send cookie
    // send res

    const { email, password } = req.body

    if (!(email || password)) {
        throw new ApiError(400, 'Required fields are empty')
    }

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(404, 'Invalid user credentials')
    }

    const { refreshToken, accessToken } =
        await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        '-password -refreshToken'
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie('refreshToken', refreshToken)
        .cookie('accessToken', accessToken)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                'User logged in successfully'
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,

        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(200, {}, 'User logged out successfully')
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, 'Unauthorized request')
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, 'Invalid refresh token')
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'Refresh token either expired or used')
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { newRefreshToken, accessToken } =
            await generateAccessTokenAndRefreshToken(user?._id)

        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    'Access token refreshed'
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid refresh token')
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, 'Invalid old password')
    }

    user.password = newPassword
    user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password changed successfully'))
})

const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, 'All fields are required')
    }

    const updateData = {}

    if (fullName) {
        updateData.fullName = fullName
    }
    if (email) {
        updateData.email = email
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                updateData,
            },
        },
        { new: true }
    ).select('-password')

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'User updated successfully'))
})

const updateProfilePhoto = asyncHandler(async (req, res) => {
    const profilePhotoLocalPath = req.file?.path
    if (!profilePhotoLocalPath) {
        throw new ApiError(400, 'ProfilePhoto file is missing')
    }

    const profilePhoto = await uploadOnCloudinary(profilePhotoLocalPath)

    if (!profilePhoto.url || !profilePhoto) {
        throw new ApiError(400, 'Error while updating profilePhoto')
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                profilePhoto: profilePhoto.url,
            },
        },
        { new: true }
    ).select('-password')

    return res
        .status(200)
        .json(new ApiResponse(200, 'Profile Image updated successfully'))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateUserDetails,
    updateProfilePhoto,
}