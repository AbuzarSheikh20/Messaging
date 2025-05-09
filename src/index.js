import { app } from './app.js'
import connectDB from './db/index.js'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port: ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log('MongoDB connection failed', err)
    })

// Handling caught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
    process.exit(1)
})

// Handling unhandled promise Rejection exceptions
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
    process.exit(1)
})
