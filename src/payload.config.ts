// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { v2 as cloudinary } from 'cloudinary'
import type { HandleUpload, GenerateURL } from '@payloadcms/plugin-cloud-storage/types'
import type { UploadApiResponse } from 'cloudinary'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

//setting up clodinary CONFIG
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// creating cloudinary adapter
const cloudinaryAdapter = () => ({
  name: 'cloudinary-adapter',
  async handleUpload({
    file,
    collection,
    data,
    req,
    clientUploadContext,
  }: Parameters<HandleUpload>[0]) {
    try {
      // createing a function that will upload your file in cloudinary
      // Uploading the file to Cloudinary using upload_stream.
      // Since Cloudinary's upload_stream is callback-based, we wrap it in a Promise
      // so we can use async/await syntax for cleaner, easier handling.
      // It uploads the file with a specific public_id under "media/", without overwriting existing files.
      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto', // auto-detect file type (image, video, etc.)
            public_id: `media/${file.filename.replace(/\.[^/.]+$/, '')}`, // Set custom file name without extension
            overwrite: false, // Do not overwrite if a file with the same name exists
            use_filename: true, // Use original filename
          },
          (error, result) => {
            if (error) return reject(error)
            if (!result) return reject(new Error('No result returned from Cloudinary'))
            resolve(result) // hanlde result
          },
        )
        uploadStream.end(file.buffer) // this line send the file to cloudinary it means entire file is already in memory and will be send whole thing at once not in chunk
      })
      file.filename = uploadResult.public_id // Use Cloudinary's public_id as the file's unique name
      file.mimeType = `${uploadResult.format}` // Set MIME type based on Cloudinary's format (e.g., image/png)
      file.filesize = uploadResult.bytes // Set the actual file size in bytes, for admin display and validations
    } catch (err) {
      console.error('Upload Error', err)
    }
  },

  async handleDelete() {},
  staticHandler() {
    return new Response('Not implemented', { status: 501 })
  },
})

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    cloudStoragePlugin({
      collections: {
        media: {
          adapter: cloudinaryAdapter,
          disableLocalStorage: true,
          generateFileURL: ({ filename }) => {
            // since we uploaded file to the media folder we will use media in our url to get the correct url from cloduinary

            return cloudinary.url(`media/${filename}`, { secure: true })
          },
        },
      },
    }),

    // storage-adapter-placeholder
  ],
})
