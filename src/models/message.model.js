import mongoose from 'mongoose'
import {MessageStatus} from '../constants.js'

const messageSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: [true, 'Content is required'],
            trim: true,
        },
        fileUrl: {
            type: String,
            trim: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(MessageStatus), // returns values in Array
            default: MessageStatus.NEW,
        },
        hasResponse: {
            type: Boolean,
            default: false,
        },
        response: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Response',
        },
    },
    { timestamps: true }
)

// Virtuals are computed dynamically and not stored in database (mongoDB)

messageSchema.virtual('date').get(function () {
    return this.createdAt
})

messageSchema.virtual('hasResponseVirtual').get(function () {
    return !!this.response
})

// Always add when using virtuals
messageSchema.set('toJSON', { virtuals: true })
messageSchema.set('toObject', { virtuals: true })

messageSchema.pre('save', function (next) {
    if (this.response) {
        ;(this.hasResponse = true), (this.status = MessageStatus.RESPONDED)
    }
    next()
})
export const Message = mongoose.model('Message', messageSchema)
