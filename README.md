# ☁️ Payload CMS + Cloudinary Integration

This repo demonstrates how to upload media from [Payload CMS](https://payloadcms.com/) directly to [Cloudinary](https://cloudinary.com/) using the new `@payloadcms/plugin-cloud-storage`.

✅ No local file storage  
✅ Cloudinary-hosted URLs  
✅ Full working example

---

## 🔗 Blog Guide

I wrote a full blog explaining this step-by-step with code and reasoning:  
📖 [Read it on Medium](https://medium.com/@neupanesahitya1/how-i-integrated-cloudinary-with-payload-cms-so-you-dont-have-to-struggle-like-i-did-58ace37dd531)

---

## 🛠️ Setup

### 1. Create a Payload Project

```bash
npx create-payload-app@latest -t blank
2. Install Dependencies
bash
Copy
Edit
npm install cloudinary @payloadcms/plugin-cloud-storage
⚙️ Configure Environment
Create a .env file with the following values (or use .env.example from this repo):

env
Copy
Edit
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
🧩 Cloudinary Adapter (Inline in Config)
The adapter handles file upload, delete, and URL generation using Cloudinary's API.

ts
Copy
Edit
import type { HandleUpload, HandleDelete } from '@payloadcms/plugin-cloud-storage/types'
import type { UploadApiResponse } from 'cloudinary'

const cloudinaryAdapter = () => ({
  name: 'cloudinary-adapter',
  async handleUpload({ file }: Parameters<HandleUpload>[0]) {
    try {
      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            public_id: `media/${file.filename.replace(/\.[^/.]+$/, '')}`,
            overwrite: false,
            use_filename: true,
          },
          (error, result) => {
            if (error) return reject(error)
            if (!result) return reject(new Error('No result returned from Cloudinary'))
            resolve(result)
          },
        )
        uploadStream.end(file.buffer)
      })

      file.filename = uploadResult.public_id
      file.mimeType = `${uploadResult.format}`
      file.filesize = uploadResult.bytes
    } catch (err) {
      console.error('Upload Error', err)
    }
  },

  async handleDelete({ filename }: Parameters<HandleDelete>[0]) {
    try {
      await cloudinary.uploader.destroy(`media/${filename.replace(/\.[^/.]+$/, '')}`)
    } catch (error) {
      console.error('Cloudinary Delete Error:', error)
    }
  },

  staticHandler() {
    return new Response('Not implemented', { status: 501 })
  },
})
🔌 Register the Plugin
In your payload.config.ts:

ts
Copy
Edit
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'

plugins: [
  cloudStoragePlugin({
    collections: {
      media: {
        adapter: cloudinaryAdapter,

        disableLocalStorage: true, // Store files only in Cloudinary

        generateFileURL: ({ filename }) => {
          return cloudinary.url(`media/${filename}`, { secure: true })
        },
      },
    },
  }),
]
📸 What You Get
✅ File uploads go directly to Cloudinary

🌐 Public URLs are shown inside the Payload admin panel

🗑️ Deleted media gets removed from Cloudinary too

⭐ Contribute
If this helped you, consider starring the repo and sharing the blog:
📌 GitHub Repo
📖 Blog Post
```
