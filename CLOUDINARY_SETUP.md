# Cloudinary Setup for ForumX Conference

This document provides instructions on how to set up Cloudinary for storing images and videos in the ForumX Conference application.

## What is Cloudinary?

Cloudinary is a cloud-based service that provides an end-to-end image and video management solution including uploads, storage, manipulations, optimizations, and delivery.

## Setting Up Cloudinary

1. **Create a Cloudinary Account**:
   - Go to [Cloudinary's website](https://cloudinary.com/) and sign up for a free account.
   - Once registered, you'll have access to your dashboard.

2. **Get Your API Credentials**:
   - In your Cloudinary dashboard, locate your account details.
   - You'll need three key pieces of information:
     - Cloud Name
     - API Key
     - API Secret

3. **Configure Environment Variables**:
   - Create a `.env` file in the root of your project (if it doesn't exist).
   - Add the following variables with your Cloudinary credentials:
     ```
     VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
     VITE_CLOUDINARY_API_KEY=your_api_key
     VITE_CLOUDINARY_API_SECRET=your_api_secret
     ```
   - For server-side usage, use:
     ```
     CLOUDINARY_CLOUD_NAME=your_cloud_name
     CLOUDINARY_API_KEY=your_api_key
     CLOUDINARY_API_SECRET=your_api_secret
     ```

## Features Implemented

Our application uses Cloudinary to store and serve various types of media:

1. **Chat Images**: Users can upload images in the chat for sharing with other participants.
2. **Video Snapshots**: Users can capture screenshots from their camera and share them in the chat.
3. **Video Recordings**: Users can record short video clips and share them in the conference.

## Technical Implementation

The Cloudinary integration is implemented in the following files:

- `src/lib/cloudinaryService.ts`: Service for handling Cloudinary uploads and operations.
- `src/pages/Conference.tsx`: UI integration for capturing and uploading media.

## Usage in the Application

### Uploading Images to Chat

1. Click the image icon in the chat input area.
2. Select an image from your device.
3. The image will be uploaded to Cloudinary and shared in the chat.

### Capturing Camera Snapshots

1. Click the camera icon in the video controls.
2. A screenshot of your current camera view will be captured, uploaded to Cloudinary, and shared in the chat.

### Recording and Sharing Video Clips

1. Click the share icon in the video controls to start recording.
2. The recording will run for 30 seconds or until you stop it.
3. The video will be uploaded to Cloudinary and shared in the chat.

## Folder Structure in Cloudinary

Media is organized in Cloudinary using the following folder structure:

- `forumx-conference/{conferenceId}/chat`: For images shared in chat
- `forumx-conference/{conferenceId}/snapshots`: For camera snapshots
- `forumx-conference/{conferenceId}/recordings`: For video recordings

## Security Considerations

- API secrets should never be exposed in client-side code. For production, use authenticated uploads via a backend API.
- Consider adding upload constraints (file size, type, dimensions) to prevent abuse.
- Implement proper authentication to ensure only conference participants can upload media.

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Upload API](https://cloudinary.com/documentation/upload_images)
- [Cloudinary Video Transformations](https://cloudinary.com/documentation/video_manipulation_and_delivery) 