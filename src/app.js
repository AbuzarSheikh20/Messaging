import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
)
app.use(express.json({ limit: '16kb' }))
app.use(
    express.urlencoded({
        extended: true,
        limit: '16kb',
    })
)
app.use(express.static('public'))
app.use(cookieParser())

// Import routers
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.route.js'
import messagesRoutes from './routes/message.routes.js'
import responsesRoutes from './routes/response.routes.js'

// routes declaration
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/messages', messagesRoutes)
app.use('/api/v1/responses', responsesRoutes)

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Routes not found',
    })
})

export { app }
