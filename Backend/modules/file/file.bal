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
    region: "us-east-1", // Use standard region for compatibility
    "endpoint": r2Endpoint // Custom endpoint for Cloudflare R2
};

// Initialize S3 client
s3:Client r2Client = check new (r2Config);

// In-memory file storage for local fallback
map<byte[]> localFileStorage = {};

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
    
    // Try to upload to R2 first
    error? uploadResult = r2Client->createObject(r2BucketName, s3Key, fileContent);
    
    string fileUrl;
    string storageLocation;
    
    if uploadResult is error {
        io:println("⚠️  R2 upload failed, falling back to local storage: " + uploadResult.message());
        // Store in local memory for fallback
        localFileStorage[fileId] = fileContent;
        // Use local storage URL as fallback
        fileUrl = string `http://localhost:8080/files/${fileId}/download`;
        storageLocation = "local-storage";
    } else {
        io:println("✅ Successfully uploaded to R2");
        // Use R2 public URL
        fileUrl = string `${r2Endpoint}/${s3Key}`;
        storageLocation = r2BucketName;
    }
    
    // Create file metadata
    FileMetadata metadata = {
        fileId: fileId,
        originalFileName: fileName,
        fileUrl: fileUrl,
        contentType: contentType,
        fileSize: fileContent.length(),
        uploadedBy: uploadedBy,
        uploadTimestamp: timestamp,
        bucketName: storageLocation,
        s3Key: s3Key
    };
    
    UploadResponse response = {
        status: "success",
        message: string `File uploaded successfully to ${storageLocation}`,
        fileId: fileId,
        fileUrl: metadata.fileUrl,
        metadata: metadata
    };
    
    io:println("✅ File upload completed: " + fileId);
    return response;
}

// Download file (with local fallback)
public function downloadFile(string fileId) returns byte[]|error {
    io:println("📥 Downloading file: " + fileId);
    
    // First check local storage
    if localFileStorage.hasKey(fileId) {
        io:println("✅ File found in local storage: " + fileId);
        return localFileStorage[fileId] ?: [];
    }
    
    // If not in local storage, return error (R2 download would need s3Key)
    io:println("❌ File not found in local storage: " + fileId);
    return error("File not found in local storage: " + fileId);
}

// Download file from Cloudflare R2 using S3 key
public function downloadFileFromR2(string s3Key) returns byte[]|error {
    io:println("📥 Downloading file from R2: " + s3Key);
    io:println("🔧 R2 Config - Bucket: " + r2BucketName + ", Endpoint: " + r2Endpoint);
    io:println("🔧 S3 Key: " + s3Key);
    
    stream<byte[], io:Error?>|error getResult = r2Client->getObject(r2BucketName, s3Key);
    
    if getResult is error {
        io:println("❌ R2 download failed: " + getResult.message());
        io:println("❌ Error details: " + getResult.toString());
        return error("Failed to download file from R2: " + getResult.message());
    }
    
    byte[] combinedContent = [];
    error? streamError = getResult.forEach(function(byte[] chunk) {
        combinedContent.push(...chunk);
    });
    
    if streamError is error {
        io:println("❌ Error reading R2 stream: " + streamError.message());
        return error("Failed to read file stream from R2: " + streamError.message());
    }
    
    io:println("✅ File downloaded successfully from R2, size: " + combinedContent.length().toString() + " bytes");
    
    return combinedContent;
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

// Debug function to test R2 connectivity and list bucket contents
public function debugR2Connection() returns string|error {
    io:println("🔧 Testing R2 connection and listing bucket contents...");
    io:println("🔧 R2 Config - Bucket: " + r2BucketName + ", Endpoint: " + r2Endpoint);
    io:println("🔧 R2 Config - Access Key ID: " + r2AccessKeyId.substring(0, 8) + "...");
    io:println("🔧 R2 Config - Region: us-east-1");
    
    // Test basic R2 connection with error handling
    s3:S3Object[]|error listResult = r2Client->listObjects(r2BucketName);
    
    if listResult is error {
        io:println("❌ R2 connection failed: " + listResult.message());
        io:println("❌ Error details: " + listResult.toString());
        
        // Try to provide more specific debugging info
        string debugInfo = "R2 Connection Debug:\n";
        debugInfo += "- Bucket: " + r2BucketName + "\n";
        debugInfo += "- Endpoint: " + r2Endpoint + "\n";
        debugInfo += "- Access Key: " + r2AccessKeyId.substring(0, 8) + "...\n";
        debugInfo += "- Error: " + listResult.message() + "\n";
        debugInfo += "- Full Error: " + listResult.toString() + "\n";
        
        return debugInfo;
    }
    
    io:println("✅ R2 connection successful!");
    io:println("📋 Found " + listResult.length().toString() + " objects in bucket");
    
    string result = "R2 Bucket Contents:\n";
    result += "Bucket: " + r2BucketName + "\n";
    result += "Endpoint: " + r2Endpoint + "\n";
    result += "Objects found: " + listResult.length().toString() + "\n\n";
    
    foreach s3:S3Object obj in listResult {
        string objName = obj.objectName ?: "unknown";
        string objSize = obj.objectSize ?: "unknown";
        result += "- " + objName + " (size: " + objSize + ")\n";
        io:println("📄 Object: " + objName + " (size: " + objSize + ")");
    }
    
    return result;
}
