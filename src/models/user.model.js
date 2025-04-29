import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'
// import { UserRoles, UserStatus } from '../../../my projects/messaging/backend/src/constants'

const userSchema = new Schema(
    {
        fullName: {
            type: String,
            required: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required!'],
            minlength: [8, 'Password must be at least 8 characters'],
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: true,
            default: 'male',
        },
        role: {
            enum: Object.values(UserRoles),
            default: UserRoles.CLIENT,
        },
        status: {
            enum: Object.values(UserStatus),
            default: UserStatus.ACTIVE,
        },
        bio: {
            type: String,
            required: true,
        },
        experience: {
            type: String,
            required: true,
        },
        specialities: {
            type: String,
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
        },
        profilePhoto: {
            type: String, // cloudinary url
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            fullName: this.fullName,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

userSchema.plugin(mongooseAggregatePaginate)

export const User = mongoose.model('User', userSchema)
