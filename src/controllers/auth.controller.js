import { asyncHandler } from '../utills/asyncHandler.js'
import { ApiError } from '../utills/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utills/cloudinary.js'
import { ApiResponse } from '../utills/ApiResponce.js'

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken
        const refreshToken = user.generateRefreshToken

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
    const user = User.create({
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

    const loggedInUser = User.findById(user._id).select(
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

export { registerUser }
