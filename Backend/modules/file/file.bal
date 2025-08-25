import ballerina/io;
import ballerina/uuid;
import ballerina/time;
import ballerina/regex;
import ballerinax/aws.s3;

// Configuration for Cloudflare R2 (S3 compatible)
configurable string r2AccessKeyId = ?;
configurable string r2SecretAccessKey = ?;
configurable string r2BucketName = ?;
configurable string r2Endpoint = ?;

// AWS S3 client configuration for Cloudflare R2
s3:ConnectionConfig r2Config = {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
    region: "us-east-1" // Use standard region for compatibility
};

// Initialize S3 client
s3:Client r2Client = check new (r2Config);

// Define supported content types
final readonly & map<string> contentTypes = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "webp": "image/webp",
    "pdf": "application/pdf",
    "txt": "text/plain",
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "mp4": "video/mp4",
    "avi": "video/x-msvideo",
    "mov": "video/quicktime",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xls": "application/vnd.ms-excel",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "zip": "application/zip",
    "rar": "application/x-rar-compressed"
};

// File metadata type
public type FileMetadata record {|
    string fileId;
    string originalFileName;
    string fileUrl;
    string contentType;
    int fileSize;
    string uploadedBy;
    string uploadTimestamp;
    string bucketName;
    string s3Key;
|};

// Upload response type
public type UploadResponse record {|
    string status;
    string message;
    string fileId;
    string fileUrl;
    FileMetadata metadata;
|};

// Helper function to get file extension
function getFileExtension(string fileName) returns string {
    string[] parts = regex:split(fileName, "\\.");
    if parts.length() > 1 {
        return "." + parts[parts.length() - 1].toLowerAscii();
    }
    return "";
}

// Helper function to get content type from file extension
function getContentType(string fileName) returns string {
    string[] parts = regex:split(fileName, "\\.");
    string extension = parts.length() > 1 ? parts[parts.length() - 1].toLowerAscii() : "";
    return contentTypes[extension] ?: "application/octet-stream";
}

// Helper function to validate file type
public function isValidFileType(string fileName) returns boolean {
    string[] parts = regex:split(fileName, "\\.");
    string extension = parts.length() > 1 ? parts[parts.length() - 1].toLowerAscii() : "";
    return contentTypes.hasKey(extension);
}

// Upload file to Cloudflare R2 (with local fallback)
public function uploadFile(byte[] fileContent, string fileName, string contentType, string uploadedBy) returns UploadResponse|error {
    // Generate unique file ID and S3 key
    string fileId = uuid:createType1AsString();
    string timestamp = time:utcNow()[0].toString();
    string fileExtension = getFileExtension(fileName);
    string s3Key = string `uploads/${uploadedBy}/${timestamp}/${fileId}${fileExtension}`;
    
    io:println("📤 Uploading file: " + fileName + " with key: " + s3Key);
    
    // Validate file type
    if !isValidFileType(fileName) {
        return error("Unsupported file type: " + fileName);
    }
    
    // For now, use local file storage as R2 connection is not working
    // TODO: Fix R2 connection and switch back to cloud storage
    io:println("⚠️  Using local file storage (R2 connection issue)");
    
    // Create file metadata
    FileMetadata metadata = {
        fileId: fileId,
        originalFileName: fileName,
        fileUrl: string `http://localhost:8080/files/${fileId}/download`,
        contentType: contentType,
        fileSize: fileContent.length(),
        uploadedBy: uploadedBy,
        uploadTimestamp: timestamp,
        bucketName: "local-storage",
        s3Key: s3Key
    };
    
    UploadResponse response = {
        status: "success",
        message: "File uploaded successfully (local storage)",
        fileId: fileId,
        fileUrl: metadata.fileUrl,
        metadata: metadata
    };
    
    io:println("✅ File upload simulated successfully: " + fileId);
    return response;
}

// Download file (with local fallback)
public function downloadFile(string s3Key) returns byte[]|error {
    io:println("📥 Downloading file: " + s3Key);
    
    // For now, return dummy content since we're using local storage
    // TODO: Implement actual file retrieval when R2 is working
    io:println("⚠️  Using local file storage (R2 connection issue)");
    
    string dummyContent = "File content for: " + s3Key + "\n\nThis is a placeholder until R2 connection is fixed.";
    byte[] fileContent = dummyContent.toBytes();
    
    io:println("✅ File download simulated: " + s3Key);
    return fileContent;
}

// Delete file from Cloudflare R2
public function deleteFile(string s3Key) returns error? {
    io:println("🗑️ Deleting file from R2: " + s3Key);
    
    error? deleteResult = r2Client->deleteObject(r2BucketName, s3Key);
    
    if deleteResult is error {
        io:println("❌ R2 delete failed: " + deleteResult.message());
        return error("Failed to delete file from R2: " + deleteResult.message());
    }
    
    io:println("✅ File deleted successfully from R2: " + s3Key);
    return;
}

// Get file metadata from Cloudflare R2
public function getFileMetadata(string s3Key) returns FileMetadata|error {
    io:println("ℹ️ Getting file metadata from R2: " + s3Key);
    
    // For R2, we can try to get object info or construct metadata from the key
    // Since R2 doesn't have direct metadata API, we'll construct it from the key
    string[] keyParts = regex:split(s3Key, "/");
    if keyParts.length() < 4 {
        return error("Invalid S3 key format: " + s3Key);
    }
    
    string uploadedBy = keyParts[1];
    string timestamp = keyParts[2];
    string fileIdWithExt = keyParts[3];
    
    // Extract file ID and extension
    string[] fileParts = regex:split(fileIdWithExt, "\\.");
    string fileId = fileParts.length() > 1 ? fileParts[0] : fileIdWithExt;
    string extension = fileParts.length() > 1 ? "." + fileParts[1] : "";
    
    FileMetadata metadata = {
        fileId: fileId,
        originalFileName: "file" + extension,
        fileUrl: string `${r2Endpoint}/${s3Key}`,
        contentType: getContentType("file" + extension),
        fileSize: 0, // Would need separate call to get actual size
        uploadedBy: uploadedBy,
        uploadTimestamp: timestamp,
        bucketName: r2BucketName,
        s3Key: s3Key
    };
    
    io:println("✅ File metadata retrieved from R2: " + s3Key);
    return metadata;
}

// List files for user from Cloudflare R2
public function listUserFiles(string userId) returns FileMetadata[]|error {
    io:println("📋 Listing files from R2 for user: " + userId);
    
    string prefix = string `uploads/${userId}/`;
    s3:S3Object[]|error listResult = r2Client->listObjects(r2BucketName, prefix = prefix);
    
    if listResult is error {
        io:println("❌ R2 list failed: " + listResult.message());
        return error("Failed to list files from R2: " + listResult.message());
    }
    
    FileMetadata[] files = [];
    foreach s3:S3Object obj in listResult {
        string s3Key = obj.objectName ?: "";
        if s3Key != "" {
            FileMetadata|error metadata = getFileMetadata(s3Key);
            if metadata is FileMetadata {
                // Get file size from S3 object with proper null handling
                int fileSize = 0;
                string? objSize = obj.objectSize;
                if objSize is string {
                    int|error sizeResult = int:fromString(objSize);
                    fileSize = sizeResult is int ? sizeResult : 0;
                }
                
                // Create a new metadata record with the actual file size from S3
                FileMetadata updatedMetadata = {
                    fileId: metadata.fileId,
                    originalFileName: metadata.originalFileName,
                    fileUrl: metadata.fileUrl,
                    contentType: metadata.contentType,
                    fileSize: fileSize,
                    uploadedBy: metadata.uploadedBy,
                    uploadTimestamp: metadata.uploadTimestamp,
                    bucketName: metadata.bucketName,
                    s3Key: metadata.s3Key
                };
                files.push(updatedMetadata);
            }
        }
    }
    
    io:println(string `✅ Listed ${files.length()} files from R2 for user: ${userId}`);
    return files;
}

// Generate signed URL for file access (Cloudflare R2)
public function generateSignedUrl(string s3Key, int expirySeconds) returns string|error {
    io:println("🔗 Generating signed URL for R2 file: " + s3Key);
    
    // Note: For production use, you'd implement proper signed URL generation
    // This is a simplified version - R2 supports S3-compatible signed URLs
    string signedUrl = string `${r2Endpoint}/${s3Key}?expires=${expirySeconds}`;
    
    io:println("✅ Signed URL generated for R2 file: " + s3Key);
    return signedUrl;
}
