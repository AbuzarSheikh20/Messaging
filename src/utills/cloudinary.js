import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLUDINARY_API_SECRET,
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        })

        fs.unlinkSync(localFilePath) // After using Postman, If file is uploading successfulyy then uncomment
        // console.log('File is Uploaded on Cloudinary', response.url)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}

const deleteFromCloudinanry = async (fileUrl) => {
    try {
        if (!fileUrl) {
            return null
        }

        const publicId = fileUrl.split('/').slice(-1)[0].split('.')[0]

        const responce = await cloudinary.uploader.destroy(publicId)
        return responce
    } catch (error) {
        return null
    }
}

export { uploadOnCloudinary, deleteFromCloudinanry }