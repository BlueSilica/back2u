import ballerina/io;
import ballerina/uuid;
import ballerina/time;
import ballerina/regex;
import ballerina/file;

// Configuration for local file storage
configurable string localStoragePath = "./uploads";
configurable string baseUrl = "http://localhost:8080";

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
    string localPath;
|};

// Upload response type
public type UploadResponse record {|
    string status;
    string message;
    string fileId;
    string fileUrl;
    FileMetadata metadata;
|};

// Helper function to ensure directory exists
function ensureDirectoryExists(string dirPath) returns error? {
    // Try to read the directory, if it fails, create it
    file:MetaData[]|error dirCheck = file:readDir(dirPath);
    if dirCheck is error {
        // Directory doesn't exist, create it
        check file:createDir(dirPath, file:RECURSIVE);
    }
}

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

// Upload file to local storage
public function uploadFile(byte[] fileContent, string fileName, string contentType, string uploadedBy) returns UploadResponse|error {
    // Generate unique file ID and local path
    string fileId = uuid:createType1AsString();
    string timestamp = time:utcNow()[0].toString();
    string fileExtension = getFileExtension(fileName);
    
    io:println("📤 Uploading file: " + fileName + " for user: " + uploadedBy);
    
    // Validate file type
    if !isValidFileType(fileName) {
        return error("Unsupported file type: " + fileName);
    }
    
    // Create directory structure: uploads/userId/timestamp/
    string userDir = localStoragePath + "/" + uploadedBy + "/" + timestamp;
    check ensureDirectoryExists(userDir);
    
    // Create full file path
    string localFileName = fileId + fileExtension;
    string localPath = userDir + "/" + localFileName;
    
    // Write file to local storage
    check io:fileWriteBytes(localPath, fileContent);
    
    // Create file metadata
    FileMetadata metadata = {
        fileId: fileId,
        originalFileName: fileName,
        fileUrl: string `${baseUrl}/files/${fileId}/download`,
        contentType: contentType,
        fileSize: fileContent.length(),
        uploadedBy: uploadedBy,
        uploadTimestamp: timestamp,
        localPath: localPath
    };
    
    UploadResponse response = {
        status: "success",
        message: "File uploaded successfully to local storage",
        fileId: fileId,
        fileUrl: metadata.fileUrl,
        metadata: metadata
    };
    
    io:println("✅ File uploaded successfully: " + fileId + " at " + localPath);
    return response;
}

// Download file from local storage by fileId
public function downloadFile(string fileId) returns byte[]|error {
    io:println("📥 Downloading file: " + fileId);
    
    // Find the file by searching through user directories
    FileMetadata|error metadata = getFileMetadataById(fileId);
    if metadata is error {
        return error("File not found: " + fileId);
    }
    
    // Read file from local storage
    byte[]|error fileContent = io:fileReadBytes(metadata.localPath);
    if fileContent is error {
        return error("Failed to read file: " + fileContent.message());
    }
    
    io:println("✅ File downloaded successfully: " + fileId);
    return fileContent;
}

// Helper function to find file metadata by fileId
function getFileMetadataById(string fileId) returns FileMetadata|error {
    // Search through all user directories to find the file
    file:MetaData[]|error entries = file:readDir(localStoragePath);
    if entries is error {
        return error("Failed to read uploads directory: " + entries.message());
    }
    
    foreach file:MetaData entry in entries {
        if entry.dir {
            // This is a user directory
            string userDir = entry.absPath;
            FileMetadata|error metadata = searchFileInUserDir(userDir, fileId);
            if metadata is FileMetadata {
                return metadata;
            }
        }
    }
    
    return error("File not found: " + fileId);
}

// Helper function to search for file in user directory
function searchFileInUserDir(string userDir, string fileId) returns FileMetadata|error {
    file:MetaData[]|error timestampDirs = file:readDir(userDir);
    if timestampDirs is error {
        return error("Failed to read user directory: " + timestampDirs.message());
    }
    
    foreach file:MetaData timestampDir in timestampDirs {
        if timestampDir.dir {
            file:MetaData[]|error files = file:readDir(timestampDir.absPath);
            if files is error {
                continue;
            }
            
            foreach file:MetaData fileEntry in files {
                if !fileEntry.dir {
                    string[] pathSegments = regex:split(fileEntry.absPath, "/");
                    string fileName = pathSegments[pathSegments.length() - 1];
                    if fileName.startsWith(fileId) {
                        // Extract metadata from path structure
                        string[] pathParts = regex:split(timestampDir.absPath, "/");
                        string uploadedBy = pathParts[pathParts.length() - 2];
                        string timestamp = pathParts[pathParts.length() - 1];
                        
                        // Get file extension from filename
                        string[] nameParts = regex:split(fileName, "\\.");
                        string extension = nameParts.length() > 1 ? "." + nameParts[1] : "";
                        
                        FileMetadata metadata = {
                            fileId: fileId,
                            originalFileName: "file" + extension,
                            fileUrl: string `${baseUrl}/files/${fileId}/download`,
                            contentType: getContentType("file" + extension),
                            fileSize: fileEntry.size,
                            uploadedBy: uploadedBy,
                            uploadTimestamp: timestamp,
                            localPath: fileEntry.absPath
                        };
                        
                        return metadata;
                    }
                }
            }
        }
    }
    
    return error("File not found in user directory");
}

// Delete file from local storage
public function deleteFile(string fileId) returns error? {
    io:println("🗑️ Deleting file from local storage: " + fileId);
    
    // Find the file metadata first
    FileMetadata|error metadata = getFileMetadataById(fileId);
    if metadata is error {
        return error("File not found: " + fileId);
    }
    
    // Delete the file from local storage
    error? deleteResult = file:remove(metadata.localPath);
    if deleteResult is error {
        return error("Failed to delete file: " + deleteResult.message());
    }
    
    io:println("✅ File deleted successfully from local storage: " + fileId);
    return;
}

// Get file metadata from local storage
public function getFileMetadata(string fileId) returns FileMetadata|error {
    io:println("ℹ️ Getting file metadata from local storage: " + fileId);
    
    // Use the existing helper function to find metadata
    FileMetadata|error metadata = getFileMetadataById(fileId);
    if metadata is error {
        return error("File metadata not found: " + fileId);
    }
    
    io:println("✅ File metadata retrieved from local storage: " + fileId);
    return metadata;
}

// List files for user from local storage
public function listUserFiles(string userId) returns FileMetadata[]|error {
    io:println("📋 Listing files from local storage for user: " + userId);
    
    string userDir = localStoragePath + "/" + userId;
    
    // Try to read user directory, if it fails, return empty array
    file:MetaData[]|error timestampDirs = file:readDir(userDir);
    if timestampDirs is error {
        io:println("✅ No files found for user: " + userId);
        return [];
    }
    
    FileMetadata[] files = [];
    
    foreach file:MetaData timestampDir in timestampDirs {
        if timestampDir.dir {
            // Read files in timestamp directory
            file:MetaData[]|error fileEntries = file:readDir(timestampDir.absPath);
            if fileEntries is error {
                continue;
            }
            
            foreach file:MetaData fileEntry in fileEntries {
                if !fileEntry.dir {
                    // Extract file information
                    string[] pathSegments = regex:split(fileEntry.absPath, "/");
                    string fileName = pathSegments[pathSegments.length() - 1];
                    
                    // Extract fileId and extension from filename
                    string[] nameParts = regex:split(fileName, "\\.");
                    string fileId = nameParts[0];
                    string extension = nameParts.length() > 1 ? "." + nameParts[1] : "";
                    
                    // Extract timestamp from path
                    string[] timestampPathSegments = regex:split(timestampDir.absPath, "/");
                    string timestamp = timestampPathSegments[timestampPathSegments.length() - 1];
                    
                    FileMetadata metadata = {
                        fileId: fileId,
                        originalFileName: "file" + extension,
                        fileUrl: string `${baseUrl}/files/${fileId}/download`,
                        contentType: getContentType("file" + extension),
                        fileSize: fileEntry.size,
                        uploadedBy: userId,
                        uploadTimestamp: timestamp,
                        localPath: fileEntry.absPath
                    };
                    
                    files.push(metadata);
                }
            }
        }
    }
    
    io:println(string `✅ Listed ${files.length()} files from local storage for user: ${userId}`);
    return files;
}

// Generate URL for file access (local storage)
public function generateSignedUrl(string fileId, int expirySeconds) returns string|error {
    io:println("🔗 Generating URL for local file: " + fileId);
    
    // For local storage, we just return the direct download URL
    // In a production environment, you might implement token-based access control
    string fileUrl = string `${baseUrl}/files/${fileId}/download`;
    
    io:println("✅ URL generated for local file: " + fileId);
    return fileUrl;
}
