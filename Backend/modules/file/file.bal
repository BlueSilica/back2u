import ballerina/io;
import ballerina/uuid;
import ballerina/time;

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

// Simple file upload simulation (will be replaced with actual S3/R2 implementation)
public function uploadFile(byte[] fileContent, string fileName, string contentType, string uploadedBy) returns UploadResponse|error {
    // Generate unique file ID
    string fileId = uuid:createType1AsString();
    string timestamp = time:utcNow()[0].toString();
    string fileExtension = getFileExtension(fileName);
    string s3Key = string `uploads/${timestamp}/${fileId}${fileExtension}`;
    
    io:println("📤 Simulating file upload: " + fileName);
    
    // Simulate successful upload
    FileMetadata metadata = {
        fileId: fileId,
        originalFileName: fileName,
        fileUrl: "https://example.com/" + s3Key,
        contentType: contentType,
        fileSize: fileContent.length(),
        uploadedBy: uploadedBy,
        uploadTimestamp: timestamp,
        bucketName: "demo-bucket",
        s3Key: s3Key
    };
    
    UploadResponse response = {
        status: "success",
        message: "File uploaded successfully",
        fileId: fileId,
        fileUrl: metadata.fileUrl,
        metadata: metadata
    };
    
    io:println("✅ File upload simulation completed: " + fileId);
    return response;
}

// Download file (simulation)
public function downloadFile(string s3Key) returns byte[]|error {
    io:println("📥 Simulating file download: " + s3Key);
    
    // Return dummy content for now
    string dummyContent = "This is a dummy file content for: " + s3Key;
    return dummyContent.toBytes();
}

// Delete file (simulation)
public function deleteFile(string s3Key) returns error? {
    io:println("🗑️ Simulating file deletion: " + s3Key);
    // Simulate successful deletion
    return;
}

// Get file metadata (simulation)
public function getFileMetadata(string s3Key) returns FileMetadata|error {
    io:println("ℹ️ Simulating get file metadata: " + s3Key);
    
    // Return dummy metadata
    FileMetadata metadata = {
        fileId: "dummy-file-id",
        originalFileName: "dummy-file.txt",
        fileUrl: "https://example.com/" + s3Key,
        contentType: "text/plain",
        fileSize: 1024,
        uploadedBy: "dummy-user",
        uploadTimestamp: time:utcNow()[0].toString(),
        bucketName: "demo-bucket",
        s3Key: s3Key
    };
    
    return metadata;
}

// Generate signed URL (simulation)
public function generateSignedUrl(string s3Key, int expirySeconds) returns string|error {
    io:println("🔗 Simulating signed URL generation: " + s3Key);
    
    // Return dummy signed URL
    string signedUrl = string `https://example.com/${s3Key}?signed=true&expires=${expirySeconds}`;
    return signedUrl;
}

// Helper function to get file extension
function getFileExtension(string fileName) returns string {
    int? lastDotIndex = fileName.lastIndexOf(".");
    if lastDotIndex is int && lastDotIndex > 0 {
        return fileName.substring(lastDotIndex);
    }
    return "";
}

// List files for user (simulation)
public function listUserFiles(string userId) returns FileMetadata[]|error {
    io:println("📋 Simulating list files for user: " + userId);
    
    // Return dummy file list
    FileMetadata[] files = [
        {
            fileId: "file-1",
            originalFileName: "document1.pdf",
            fileUrl: "https://example.com/uploads/doc1.pdf",
            contentType: "application/pdf",
            fileSize: 2048,
            uploadedBy: userId,
            uploadTimestamp: time:utcNow()[0].toString(),
            bucketName: "demo-bucket",
            s3Key: "uploads/doc1.pdf"
        }
    ];
    
    return files;
}

// Helper function to validate file types
public function isValidFileType(string contentType) returns boolean {
    string[] allowedTypes = [
        "image/jpeg",
        "image/jpg", 
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    
    foreach string allowedType in allowedTypes {
        if contentType.toLowerAscii() == allowedType {
            return true;
        }
    }
    
    return false;
}
