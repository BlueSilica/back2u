# File Handling Implementation - Back2U Project

## Overview
This document outlines the comprehensive file handling system implemented for the Back2U lost and found application.

## Features Implemented

### 1. **Frontend File Upload System**
- **Drag & Drop Interface**: Users can drag and drop files directly into the upload area
- **File Selection**: Click-to-select files with a clean UI
- **File Validation**: 
  - Supported formats: PNG, JPG, JPEG, GIF, WebP, PDF
  - Maximum file size: 10MB per file
  - Multiple file selection supported
- **Visual Feedback**: Shows selected files with size information and remove buttons
- **Upload Progress**: Loading states during file upload

### 2. **Backend File Processing**
- **Cloudflare R2 Integration**: Primary storage with automatic fallback
- **Local Storage Fallback**: In-memory storage when R2 is unavailable
- **File Metadata Storage**: MongoDB collection stores comprehensive file information
- **Content Type Detection**: Automatic content type detection based on file extension
- **Unique File IDs**: UUID-based file identification system

### 3. **Lost Item Integration**
- **Image Attachments**: Users can attach multiple images when reporting lost items
- **Category-based Organization**: Files are tagged with categories (lost-item, found-item)
- **Database Linking**: Files are properly linked to lost item reports

### 4. **My Items Section**
The new "My Items" section provides comprehensive file and report management:

#### **My Reports Tab**
- Lists all items reported by the current user
- Shows item details: name, description, category, location, dates
- Displays attached images with direct links
- Status tracking (lost, found, resolved)
- Responsive card-based layout

#### **My Files Tab**
- Comprehensive file management interface
- Tabular view with file details:
  - File name with type icons
  - Content type and file size
  - Upload timestamp
  - Category classification
- Actions: View and Download links for each file
- File size formatting (Bytes, KB, MB, GB)

## API Endpoints

### File Operations
- `POST /files` - Upload files with multipart form data
- `GET /files/{fileId}/download` - Download specific file
- `GET /files/{fileId}` - Get file metadata
- `GET /files/user/{userEmail}` - List all files uploaded by a user
- `DELETE /files/{fileId}` - Delete a file (with user verification)

### Lost Items with File Support
- `POST /lostitems` - Create lost item report with attached files
- `GET /lostitems?reporterEmail={email}` - Get user's lost item reports
- `GET /lostitems` - Get all lost items with filtering options

## Technical Implementation

### File Storage Strategy
1. **Primary**: Cloudflare R2 (S3-compatible) cloud storage
2. **Fallback**: In-memory local storage for development/testing
3. **Metadata**: MongoDB for searchable file information

### Security Features
- File type validation on both frontend and backend
- File size limits enforced
- User-based file access control
- Unique file IDs prevent file name collisions

### Frontend Components
- Enhanced `Dashboard.tsx` with file upload functionality
- New `MyItemsSection` component for file management
- Drag & drop handlers with visual feedback
- Form validation and error handling

### Backend Modules
- `file.bal` - Core file handling operations
- `lostitem.bal` - Enhanced with file attachment support
- `main.bal` - REST API endpoints for file operations

## Configuration

### Cloudflare R2 Settings
```toml
[Backend.file]
r2AccessKeyId = "your-access-key"
r2SecretAccessKey = "your-secret-key"
r2BucketName = "back2u"
r2Endpoint = "https://your-endpoint.r2.cloudflarestorage.com"
```

### Supported File Types
- **Images**: PNG, JPG, JPEG, GIF, WebP
- **Documents**: PDF, TXT, DOC, DOCX, XLS, XLSX
- **Archives**: ZIP, RAR
- **Audio**: MP3, WAV
- **Video**: MP4, AVI, MOV

## Usage Examples

### Reporting a Lost Item with Files
1. User clicks "Report New Item"
2. Fills out item details
3. Drags/selects images of the lost item
4. Submits the report
5. Files are uploaded and linked to the report

### Managing Files
1. User navigates to "My Items" tab
2. Switches to "My Files" sub-tab
3. Views all uploaded files in a table
4. Can view or download any file
5. Files are organized by upload date and category

## Database Schema

### Files Collection
```json
{
  "fileId": "uuid-string",
  "originalFileName": "item-photo.jpg",
  "fileUrl": "https://...",
  "contentType": "image/jpeg",
  "fileSize": 1024000,
  "uploadedBy": "user@example.com",
  "uploadTimestamp": "timestamp",
  "bucketName": "back2u",
  "s3Key": "uploads/user@example.com/timestamp/uuid.jpg",
  "category": "lost-item",
  "status": "active"
}
```

### Lost Items with Images
```json
{
  "itemId": "uuid-string",
  "itemName": "iPhone 13",
  "itemImages": [
    "http://localhost:8080/files/file-uuid-1/download",
    "http://localhost:8080/files/file-uuid-2/download"
  ],
  // ... other fields
}
```

## Next Steps for Development

1. **Enhanced File Management**
   - File editing/replacement functionality
   - Bulk file operations
   - File sharing between users

2. **Advanced Features**
   - Image thumbnail generation
   - File compression for large images
   - OCR for document text extraction

3. **Performance Optimization**
   - CDN integration for faster file delivery
   - Caching strategies for file metadata
   - Lazy loading for file lists

4. **Security Enhancements**
   - Virus scanning for uploaded files
   - Digital signatures for file integrity
   - Advanced access control policies

This implementation provides a solid foundation for file handling in the Back2U application with room for future enhancements.
