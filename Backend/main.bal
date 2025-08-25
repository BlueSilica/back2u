import ballerina/http;
import ballerina/io;
import ballerina/mime;
import ballerinax/mongodb;
import Backend.user;
import Backend.chat;
import Backend.lostitem;
import Backend.file;

// CORS configuration
http:CorsConfig corsConfig = {
    allowOrigins: ["http://localhost:5173", "http://localhost:3000"],
    allowCredentials: false,
    allowHeaders: ["CORELATION_ID", "Authorization", "Content-Type", "ngrok-skip-browser-warning"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
};

// Global MongoDB client
final mongodb:Client mongoDb = check new ({
    connection: "mongodb+srv://adeepashashintha:0C71Gbok4YgQgKgb@cluster0.wapt0hl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
});

// Test MongoDB connection on startup
public function main() {
    // Connect to btu database
    var btuDb = mongoDb->getDatabase("btu");
    if btuDb is error {
        io:println("Failed to connect to 'btu' database: " + btuDb.message());
        return;
    }
    
    // Test connection by listing collections
    var collections = btuDb->listCollectionNames();
    if collections is error {
        io:println("MongoDB connection to 'btu' database failed: " + collections.message());
    } else {
        io:println("MongoDB connection successful!");
        io:println("Connected to 'btu' database");
        io:println("Available collections: ", collections);
        
        // Load existing chat rooms from database
        var loadResult = chat:loadChatRoomsFromDB(btuDb);
        if loadResult is error {
            io:println("Warning: Failed to load chat rooms from database: " + loadResult.message());
        }
    }
}

// HTTP service running on port 8080
@http:ServiceConfig {
    cors: corsConfig
}
service / on new http:Listener(8080) {
    
    // Health check endpoint
    resource function get health() returns json {
        return {"status": "OK", "message": "Server is running on port 8080"};
    }

    // Get all users endpoint
    resource function get users() returns json|http:InternalServerError {
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Delegate to user module
        return user:handleGetAllUsers(btuDb);
    }

    // Create user endpoint
    resource function post users(@http:Payload user:CreateUserRequest userRequest) returns json|http:BadRequest|http:InternalServerError {
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Delegate to user module
        return user:handleCreateUser(btuDb, userRequest);
    }

    // Login endpoint
    resource function post auth/login(@http:Payload user:LoginRequest loginRequest) returns json|http:BadRequest|http:InternalServerError {
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Delegate to user module
        return user:handleUserLogin(btuDb, loginRequest);
    }

    // Create chat room between two users
    resource function post chat/rooms(@http:Payload json payload) returns json|http:BadRequest|http:InternalServerError {
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Extract user emails from payload
        json|error userEmail1Field = payload.userEmail1;
        json|error userEmail2Field = payload.userEmail2;
        
        if userEmail1Field is error || userEmail2Field is error {
            return http:BAD_REQUEST;
        }
        
        string userEmail1 = userEmail1Field.toString();
        string userEmail2 = userEmail2Field.toString();
        
        if userEmail1 == userEmail2 {
            return {
                "error": "Cannot create chat room with the same user",
                "status": "error"
            };
        }
        
        // Create or get existing room (with database persistence) using emails
        string|error roomIdResult = chat:createOrGetRoom(userEmail1, userEmail2, btuDb);
        if roomIdResult is error {
            io:println("Error creating/getting chat room: " + roomIdResult.message());
            return http:INTERNAL_SERVER_ERROR;
        }
        
        return {
            "status": "success",
            "message": "Chat room created/retrieved successfully",
            "roomId": roomIdResult,
            "userEmails": [userEmail1, userEmail2]
        };
    }

    // Get chat room information
    resource function get chat/rooms/[string roomId]() returns json|http:NotFound {
        chat:ChatRoom? room = chat:getRoomInfo(roomId);
        
        if room is () {
            return http:NOT_FOUND;
        }
        
        return {
            "status": "success",
            "room": {
                "roomId": room.roomId,
                "userIds": room.userIds,
                "activeClients": room.clients.length(),
                "createdAt": room.createdAt
            }
        };
    }

    // Get user's active room
    resource function get chat/users/[string userId]/room() returns json {
        string? roomId = chat:getUserRoom(userId);
        
        if roomId is () {
            return {
                "status": "success",
                "message": "User is not in any chat room",
                "roomId": null
            };
        }
        
        return {
            "status": "success",
            "message": "User's active room found",
            "roomId": roomId
        };
    }

    // Get chat statistics
    resource function get chat/stats() returns json {
        return {
            "status": "success",
            "activeRooms": chat:getActiveRoomsCount()
        };
    }

    // Get all chat rooms from database
    resource function get chat/rooms() returns json|http:InternalServerError {
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Get all chat rooms from database
        chat:ChatRoomDb[]|error roomsResult = chat:getAllChatRoomsFromDB(btuDb);
        if roomsResult is error {
            io:println("Error getting chat rooms from database: " + roomsResult.message());
            return http:INTERNAL_SERVER_ERROR;
        }
        
        json[] roomsJson = [];
        foreach chat:ChatRoomDb room in roomsResult {
            json roomJson = {
                "roomId": room.roomId,
                "userIds": room.userIds,
                "createdAt": room.createdAt,
                "status": room.status
            };
            roomsJson.push(roomJson);
        }
        
        return {
            "status": "success",
            "message": "Chat rooms retrieved successfully",
            "rooms": roomsJson,
            "totalRooms": roomsResult.length()
        };
    }

    // Get chat rooms for a specific user
    resource function get chat/users/[string userEmail]/rooms() returns json|http:InternalServerError {
        io:println("🔍 API Request: Getting chat rooms for user email: " + userEmail);
        
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Get user's chat rooms from database using email
        chat:ChatRoomDb[]|error roomsResult = chat:getUserChatRoomsFromDB(btuDb, userEmail);
        if roomsResult is error {
            io:println("❌ Error getting user chat rooms from database: " + roomsResult.message());
            return http:INTERNAL_SERVER_ERROR;
        }
        
        io:println("📊 Found " + roomsResult.length().toString() + " chat rooms for user: " + userEmail);
        
        // For each room, get the other user's information
        json[] chatPartnersJson = [];
        foreach chat:ChatRoomDb room in roomsResult {
            io:println("🏠 Processing room: " + room.roomId + " with users: " + room.userIds.toString());
            
            // Find the other user email
            string? otherUserEmail = ();
            foreach string roomUserEmail in room.userIds {
                if roomUserEmail != userEmail {
                    otherUserEmail = roomUserEmail;
                    break;
                }
            }
            
            if otherUserEmail is string {
                io:println("👤 Found chat partner email: " + otherUserEmail);
                
                // Get other user's information using email
                json|error otherUserResult = user:getUserByEmailForChat(btuDb, otherUserEmail);
                if otherUserResult is json {
                    io:println("✅ Successfully retrieved partner info");
                    
                    // Extract user name safely
                    json|error firstNameResult = otherUserResult.firstName;
                    json|error lastNameResult = otherUserResult.lastName;
                    json|error emailResult = otherUserResult.email;
                    
                    string firstName = firstNameResult is json ? firstNameResult.toString() : "";
                    string lastName = lastNameResult is json ? lastNameResult.toString() : "";
                    string email = emailResult is json ? emailResult.toString() : "";
                    string fullName = (firstName + " " + lastName).trim();
                    
                    json partnerJson = {
                        "roomId": room.roomId,
                        "partnerEmail": otherUserEmail,
                        "partnerName": fullName.length() > 0 ? fullName : email,
                        "createdAt": room.createdAt,
                        "status": room.status
                    };
                    chatPartnersJson.push(partnerJson);
                    io:println("📝 Added chat partner: " + (fullName.length() > 0 ? fullName : email));
                } else {
                    io:println("❌ Failed to get user info for email: " + otherUserEmail);
                }
            } else {
                io:println("⚠️ No other user found in room for user: " + userEmail);
            }
        }
        
        io:println("📋 Final result: " + chatPartnersJson.length().toString() + " chat partners");
        
        return {
            "status": "success",
            "message": "User's chat rooms retrieved successfully",
            "chatPartners": chatPartnersJson,
            "totalRooms": chatPartnersJson.length()
        };
    }

    // Send and save a message
    resource function post chat/messages(@http:Payload json payload) returns json|http:BadRequest|http:InternalServerError {
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Extract message data from payload
        json|error roomIdField = payload.roomId;
        json|error senderEmailField = payload.senderEmail;
        json|error receiverEmailField = payload.receiverEmail;
        json|error messageField = payload.message;
        
        if roomIdField is error || senderEmailField is error || receiverEmailField is error || messageField is error {
            return http:BAD_REQUEST;
        }
        
        string roomId = roomIdField.toString();
        string senderEmail = senderEmailField.toString();
        string receiverEmail = receiverEmailField.toString();
        string message = messageField.toString();
        
        // Save message to database
        string|error messageIdResult = chat:saveMessageToDB(btuDb, roomId, senderEmail, receiverEmail, message);
        if messageIdResult is error {
            io:println("Error saving message to database: " + messageIdResult.message());
            return http:INTERNAL_SERVER_ERROR;
        }
        
        return {
            "status": "success",
            "message": "Message sent and saved successfully",
            "messageId": messageIdResult,
            "roomId": roomId,
            "senderEmail": senderEmail,
            "receiverEmail": receiverEmail
        };
    }

    // Get messages for a chat room
    resource function get chat/rooms/[string roomId]/messages() returns json|http:InternalServerError {
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Get messages for the room
        chat:MessageDb[]|error messagesResult = chat:getMessagesForRoom(btuDb, roomId);
        if messagesResult is error {
            io:println("Error getting messages from database: " + messagesResult.message());
            return http:INTERNAL_SERVER_ERROR;
        }
        
        // Convert messages to JSON format
        json[] messagesJson = [];
        foreach chat:MessageDb msg in messagesResult {
            json messageJson = {
                "messageId": msg.messageId,
                "roomId": msg.roomId,
                "senderEmail": msg.senderEmail,
                "receiverEmail": msg.receiverEmail,
                "message": msg.message,
                "timestamp": msg.timestamp,
                "status": msg.status
            };
            messagesJson.push(messageJson);
        }
        
        return {
            "status": "success",
            "message": "Messages retrieved successfully",
            "messages": messagesJson,
            "totalMessages": messagesJson.length()
        };
    }

    // Get messages between two users
    resource function get chat/messages/[string userEmail1]/[string userEmail2]() returns json|http:InternalServerError {
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // URL decode the emails
        string decodedEmail1 = userEmail1; // You might want to add URL decoding here
        string decodedEmail2 = userEmail2; // You might want to add URL decoding here
        
        // Get messages between users
        chat:MessageDb[]|error messagesResult = chat:getMessagesBetweenUsers(btuDb, decodedEmail1, decodedEmail2);
        if messagesResult is error {
            io:println("Error getting messages between users: " + messagesResult.message());
            return http:INTERNAL_SERVER_ERROR;
        }
        
        // Convert messages to JSON format
        json[] messagesJson = [];
        foreach chat:MessageDb msg in messagesResult {
            json messageJson = {
                "messageId": msg.messageId,
                "roomId": msg.roomId,
                "senderEmail": msg.senderEmail,
                "receiverEmail": msg.receiverEmail,
                "message": msg.message,
                "timestamp": msg.timestamp,
                "status": msg.status
            };
            messagesJson.push(messageJson);
        }
        
        return {
            "status": "success",
            "message": "Messages between users retrieved successfully",
            "messages": messagesJson,
            "totalMessages": messagesJson.length()
        };
    }
    
    // Get new messages since timestamp for real-time updates
    resource function get chat/rooms/[string roomId]/messages/since/[string timestamp]() returns json|http:BadRequest|http:InternalServerError {
        io:println("📥 Getting new messages for room: " + roomId + " since: " + timestamp);
        
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Get new messages since timestamp
        chat:MessageDb[]|error messagesResult = chat:getNewMessagesForRoomSince(btuDb, roomId, timestamp);
        if messagesResult is error {
            io:println("❌ Error getting new messages: " + messagesResult.message());
            return {
                "status": "error",
                "message": "Failed to retrieve new messages: " + messagesResult.message()
            };
        }
        
        // Convert messages to JSON format
        json[] messagesJson = [];
        foreach chat:MessageDb msg in messagesResult {
            json messageJson = {
                "messageId": msg.messageId,
                "roomId": msg.roomId,
                "senderEmail": msg.senderEmail,
                "receiverEmail": msg.receiverEmail,
                "message": msg.message,
                "timestamp": msg.timestamp,
                "status": msg.status
            };
            messagesJson.push(messageJson);
        }
        
        io:println("✅ Retrieved " + messagesJson.length().toString() + " new messages for room: " + roomId);
        return {
            "status": "success",
            "message": "New messages retrieved successfully",
            "messages": messagesJson,
            "totalMessages": messagesJson.length()
        };
    }

    // ============ LOST ITEM ENDPOINTS ============

    // Report a lost item
    resource function post lostitems(@http:Payload json payload) returns json|http:BadRequest|http:InternalServerError {
        io:println("📋 Reporting lost item with payload: " + payload.toJsonString());
        
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;

        // Parse and validate request
        do {
            lostitem:ReportLostItemRequest lostItemRequest = check payload.cloneWithType(lostitem:ReportLostItemRequest);
            json|error result = lostitem:reportLostItem(btuDb, lostItemRequest);
            
            if result is error {
                io:println("❌ Error reporting lost item: " + result.message());
                return {
                    "status": "error",
                    "message": "Failed to report lost item: " + result.message()
                };
            }
            
            return result;
        } on fail error e {
            io:println("❌ Invalid lost item request: " + e.message());
            return http:BAD_REQUEST;
        }
    }

    // Get all lost items with optional filtering
    resource function get lostitems(string? category = (), string? city = (), string? state = (), 
                                   decimal? latitude = (), decimal? longitude = (), decimal? radiusKm = (),
                                   string? keyword = (), string? dateFrom = (), string? dateTo = (),
                                   int? 'limit = (), int? offset = ()) returns json|http:InternalServerError {
        io:println("🔍 Getting lost items with filters");
        
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;

        // Build search parameters
        lostitem:SearchLostItemsRequest? searchParams = ();
        if category is string || city is string || state is string || latitude is decimal || 
           keyword is string || dateFrom is string || dateTo is string || 'limit is int || offset is int {
            searchParams = {
                category: category,
                city: city,
                state: state,
                latitude: latitude,
                longitude: longitude,
                radiusKm: radiusKm,
                keyword: keyword,
                dateFrom: dateFrom,
                dateTo: dateTo,
                'limit: 'limit,
                offset: offset
            };
        }

        json|error result = lostitem:getLostItems(btuDb, searchParams);
        if result is error {
            io:println("❌ Error getting lost items: " + result.message());
            return {
                "status": "error",
                "message": "Failed to retrieve lost items: " + result.message()
            };
        }
        
        return result;
    }

    // Get lost item by ID
    resource function get lostitems/[string itemId]() returns json|http:InternalServerError {
        io:println("🔍 Getting lost item by ID: " + itemId);
        
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;

        json|error result = lostitem:getLostItemById(btuDb, itemId);
        if result is error {
            io:println("❌ Error getting lost item: " + result.message());
            return {
                "status": "error",
                "message": "Failed to retrieve lost item: " + result.message()
            };
        }
        
        return result;
    }

    // Search lost items by location
    resource function get lostitems/location/[decimal latitude]/[decimal longitude](decimal radiusKm = 10.0) returns json|http:InternalServerError {
        io:println("📍 Searching lost items near location: " + latitude.toString() + ", " + longitude.toString() + " within " + radiusKm.toString() + " km");
        
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;

        json|error result = lostitem:searchLostItemsByLocation(btuDb, latitude, longitude, radiusKm);
        if result is error {
            io:println("❌ Error searching lost items by location: " + result.message());
            return {
                "status": "error",
                "message": "Failed to search lost items by location: " + result.message()
            };
        }
        
        return result;
    }

    // Update lost item status
    resource function put lostitems/[string itemId]/status(@http:Payload json payload) returns json|http:BadRequest|http:InternalServerError {
        io:println("📝 Updating lost item status for ID: " + itemId);
        
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;

        // Extract status from payload
        json|error statusJson = payload.status;
        if statusJson is error {
            return http:BAD_REQUEST;
        }
        
        string newStatus = statusJson.toString();

        json|error result = lostitem:updateLostItemStatus(btuDb, itemId, newStatus);
        if result is error {
            io:println("❌ Error updating lost item status: " + result.message());
            return {
                "status": "error",
                "message": "Failed to update lost item status: " + result.message()
            };
        }
        
        return result;
    }

    // Get lost items by reporter email
    resource function get lostitems/reporter/[string reporterEmail]() returns json|http:InternalServerError {
        io:println("👤 Getting lost items for reporter: " + reporterEmail);
        
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;

        json|error result = lostitem:getLostItemsByReporter(btuDb, reporterEmail);
        if result is error {
            io:println("❌ Error getting reporter's lost items: " + result.message());
            return {
                "status": "error",
                "message": "Failed to retrieve reporter's lost items: " + result.message()
            };
        }
        
        return result;
    }

    // ============ FILE UPLOAD/DOWNLOAD ENDPOINTS ============

    // Upload file endpoint
    resource function post files(http:Request request) returns json|http:BadRequest|http:InternalServerError|error {
        io:println("📁 Processing file upload request");
        
        // Check content type
        string|error contentType = request.getContentType();
        if contentType is error || !contentType.startsWith("multipart/form-data") {
            return http:BAD_REQUEST;
        }
        
        do {
            // Parse multipart request
            mime:Entity[]|error bodyParts = request.getBodyParts();
            if bodyParts is error {
                io:println("❌ Error parsing multipart request: " + bodyParts.message());
                return http:BAD_REQUEST;
            }
            
            string uploadedBy = "";
            string category = "";
            byte[] fileContent = [];
            string fileName = "";
            string fileType = "";
            
            // Process each part
            foreach mime:Entity part in bodyParts {
                string|error partName = part.getContentDisposition().name;
                if partName is string {
                    if partName == "uploadedBy" {
                        uploadedBy = check part.getText();
                    } else if partName == "category" {
                        category = check part.getText();
                    } else if partName == "file" {
                        fileContent = check part.getByteArray();
                        mime:ContentDisposition|error disposition = part.getContentDisposition();
                        if disposition is mime:ContentDisposition && disposition.fileName is string {
                            fileName = disposition.fileName;
                        }
                        string|error partContentType = part.getContentType();
                        if partContentType is string {
                            fileType = partContentType;
                        }
                    }
                }
            }
            
            // Validate required fields
            if uploadedBy == "" || fileName == "" || fileContent.length() == 0 {
                return {
                    "status": "error",
                    "message": "Missing required fields: uploadedBy, file, or fileName"
                };
            }
            
            // Validate file size (max 10MB for example)
            if fileContent.length() > 10485760 { // 10MB
                return {
                    "status": "error",
                    "message": "File size too large. Maximum allowed size is 10MB"
                };
            }
            
            // Validate file type
            if !file:isValidFileType(fileType) {
                return {
                    "status": "error",
                    "message": "File type not allowed. Allowed types: images, PDF, documents, text files"
                };
            }
            
            // Upload file
            file:UploadResponse|error uploadResult = file:uploadFile(fileContent, fileName, fileType, uploadedBy);
            if uploadResult is error {
                io:println("❌ File upload failed: " + uploadResult.message());
                return {
                    "status": "error",
                    "message": "File upload failed: " + uploadResult.message()
                };
            }
            
            // Store metadata in database
            mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
            if btuDbResult is error {
                return http:INTERNAL_SERVER_ERROR;
            }
            mongodb:Database btuDb = btuDbResult;
            
            mongodb:Collection filesCollection = check btuDb->getCollection("files");
            
            // Create enhanced metadata record
            map<json> fileRecord = {
                "fileId": uploadResult.fileId,
                "originalFileName": uploadResult.metadata.originalFileName,
                "fileUrl": uploadResult.fileUrl,
                "contentType": uploadResult.metadata.contentType,
                "fileSize": uploadResult.metadata.fileSize,
                "uploadedBy": uploadResult.metadata.uploadedBy,
                "uploadTimestamp": uploadResult.metadata.uploadTimestamp,
                "bucketName": uploadResult.metadata.bucketName,
                "s3Key": uploadResult.metadata.s3Key,
                "category": category,
                "status": "active"
            };
            
            check filesCollection->insertOne(fileRecord);
            
            io:println("✅ File upload completed: " + uploadResult.fileId);
            
            return {
                "status": "success",
                "message": "File uploaded successfully",
                "fileId": uploadResult.fileId,
                "fileName": fileName,
                "fileUrl": uploadResult.fileUrl,
                "fileSize": uploadResult.metadata.fileSize,
                "contentType": fileType,
                "category": category
            };
            
        } on fail error e {
            io:println("❌ File upload error: " + e.message());
            return http:BAD_REQUEST;
        }
    }

    // Download file endpoint
    resource function get files/[string fileId]/download() returns http:Response|http:NotFound|http:InternalServerError|error {
        io:println("📥 Processing file download request for: " + fileId);
        
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Get file metadata from database
        mongodb:Collection filesCollection = check btuDb->getCollection("files");
        map<json> filter = {"fileId": fileId, "status": "active"};
        
        stream<map<json>, error?> findResult = check filesCollection->find(filter);
        map<json>[] files = check from map<json> file in findResult select file;
        
        if files.length() == 0 {
            return http:NOT_FOUND;
        }
        
        map<json> fileRecord = files[0];
        string s3Key = fileRecord.get("s3Key").toString();
        string fileName = fileRecord.get("originalFileName").toString();
        string contentType = fileRecord.get("contentType").toString();
        
        // Download file from S3/R2
        byte[]|error fileContent = file:downloadFile(s3Key);
        if fileContent is error {
            io:println("❌ File download failed: " + fileContent.message());
            return http:INTERNAL_SERVER_ERROR;
        }
        
        // Create response with file content
        http:Response response = new;
        response.setBinaryPayload(fileContent, contentType);
        response.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");
        response.setHeader("Content-Length", fileContent.length().toString());
        
        io:println("✅ File download completed: " + fileId);
        return response;
    }

    // Get file metadata endpoint
    resource function get files/[string fileId]() returns json|http:NotFound|http:InternalServerError|error {
        io:println("ℹ️ Getting file metadata for: " + fileId);
        
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Get file metadata from database
        mongodb:Collection filesCollection = check btuDb->getCollection("files");
        map<json> filter = {"fileId": fileId, "status": "active"};
        
        stream<map<json>, error?> findResult = check filesCollection->find(filter);
        map<json>[] files = check from map<json> file in findResult select file;
        
        if files.length() == 0 {
            return {
                "status": "error",
                "message": "File not found"
            };
        }
        
        map<json> fileRecord = files[0];
        
        return {
            "status": "success",
            "message": "File metadata retrieved successfully",
            "file": {
                "fileId": fileRecord.get("fileId"),
                "originalFileName": fileRecord.get("originalFileName"),
                "fileUrl": fileRecord.get("fileUrl"),
                "contentType": fileRecord.get("contentType"),
                "fileSize": fileRecord.get("fileSize"),
                "uploadedBy": fileRecord.get("uploadedBy"),
                "uploadTimestamp": fileRecord.get("uploadTimestamp"),
                "category": fileRecord.get("category"),
                "status": fileRecord.get("status")
            }
        };
    }

    // List files by user endpoint
    resource function get files/user/[string userId]() returns json|http:InternalServerError|error {
        io:println("📋 Listing files for user: " + userId);
        
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Get user's files from database
        mongodb:Collection filesCollection = check btuDb->getCollection("files");
        map<json> filter = {"uploadedBy": userId, "status": "active"};
        
        stream<map<json>, error?> findResult = check filesCollection->find(filter);
        map<json>[] files = check from map<json> file in findResult select file;
        
        json[] filesJson = [];
        foreach map<json> file in files {
            json fileJson = {
                "fileId": file.get("fileId"),
                "originalFileName": file.get("originalFileName"),
                "fileUrl": file.get("fileUrl"),
                "contentType": file.get("contentType"),
                "fileSize": file.get("fileSize"),
                "uploadTimestamp": file.get("uploadTimestamp"),
                "category": file.get("category")
            };
            filesJson.push(fileJson);
        }
        
        return {
            "status": "success",
            "message": "User files retrieved successfully",
            "files": filesJson,
            "totalFiles": files.length(),
            "userId": userId
        };
    }

    // Delete file endpoint
    resource function delete files/[string fileId](@http:Payload json payload) returns json|http:BadRequest|http:NotFound|http:InternalServerError|error {
        io:println("🗑️ Deleting file: " + fileId);
        
        // Get userId from payload
        json|error userIdJson = payload.userId;
        if userIdJson is error {
            return http:BAD_REQUEST;
        }
        string userId = userIdJson.toString();
        
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Check if file exists and belongs to user
        mongodb:Collection filesCollection = check btuDb->getCollection("files");
        map<json> filter = {"fileId": fileId, "uploadedBy": userId, "status": "active"};
        
        stream<map<json>, error?> findResult = check filesCollection->find(filter);
        map<json>[] files = check from map<json> file in findResult select file;
        
        if files.length() == 0 {
            return {
                "status": "error",
                "message": "File not found or you don't have permission to delete it"
            };
        }
        
        map<json> fileRecord = files[0];
        string s3Key = fileRecord.get("s3Key").toString();
        
        // Delete file from S3/R2
        error? deleteResult = file:deleteFile(s3Key);
        if deleteResult is error {
            io:println("❌ Failed to delete file from S3: " + deleteResult.message());
            // Continue with soft delete even if S3 delete fails
        }
        
        // Soft delete in database
        map<json> updateDoc = {"status": "deleted"};
        mongodb:UpdateResult updateResult = check filesCollection->updateOne(filter, {"$set": updateDoc});
        
        if updateResult.modifiedCount == 0 {
            return {
                "status": "error",
                "message": "Failed to delete file"
            };
        }
        
        io:println("✅ File deleted successfully: " + fileId);
        
        return {
            "status": "success",
            "message": "File deleted successfully",
            "fileId": fileId
        };
    }

    // Generate signed URL endpoint
    resource function post files/[string fileId]/signedurl(@http:Payload json payload) returns json|http:NotFound|http:InternalServerError|error {
        io:println("🔗 Generating signed URL for file: " + fileId);
        
        // Get expiry from payload (optional, default 1 hour)
        int expirySeconds = 3600; // 1 hour default
        json|error expiryJson = payload.expirySeconds;
        if expiryJson is int {
            expirySeconds = expiryJson;
        }
        
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Get file metadata
        mongodb:Collection filesCollection = check btuDb->getCollection("files");
        map<json> filter = {"fileId": fileId, "status": "active"};
        
        stream<map<json>, error?> findResult = check filesCollection->find(filter);
        map<json>[] files = check from map<json> file in findResult select file;
        
        if files.length() == 0 {
            return {
                "status": "error",
                "message": "File not found"
            };
        }
        
        map<json> fileRecord = files[0];
        string s3Key = fileRecord.get("s3Key").toString();
        
        // Generate signed URL
        string|error signedUrl = file:generateSignedUrl(s3Key, expirySeconds);
        if signedUrl is error {
            io:println("❌ Failed to generate signed URL: " + signedUrl.message());
            return http:INTERNAL_SERVER_ERROR;
        }
        
        return {
            "status": "success",
            "message": "Signed URL generated successfully",
            "fileId": fileId,
            "signedUrl": signedUrl,
            "expirySeconds": expirySeconds
        };
    }

    // Chat file upload endpoint
    resource function post chat/files(http:Request request) returns json|http:BadRequest|http:InternalServerError|error {
        io:println("📁 Processing chat file upload request");
        
        // Check content type
        string|error contentType = request.getContentType();
        if contentType is error || !contentType.startsWith("multipart/form-data") {
            return http:BAD_REQUEST;
        }
        
        // Parse multipart request
        mime:Entity[]|error bodyParts = request.getBodyParts();
        if bodyParts is error {
            io:println("❌ Error parsing multipart request: " + bodyParts.message());
            return http:BAD_REQUEST;
        }
        
        string roomId = "";
        string senderEmail = "";
        string receiverEmail = "";
        string message = "";
        byte[] fileContent = [];
        string fileName = "";
        string fileType = "";
        
        // Parse form data
        foreach mime:Entity part in bodyParts {
            mime:ContentDisposition contentDisposition = part.getContentDisposition();
            string fieldName = contentDisposition.name is string ? contentDisposition.name : "";
            
            if fieldName == "roomId" {
                byte[]|error fieldValue = part.getByteArray();
                if fieldValue is byte[] {
                    roomId = check string:fromBytes(fieldValue);
                }
            } else if fieldName == "senderEmail" {
                byte[]|error fieldValue = part.getByteArray();
                if fieldValue is byte[] {
                    senderEmail = check string:fromBytes(fieldValue);
                }
            } else if fieldName == "receiverEmail" {
                byte[]|error fieldValue = part.getByteArray();
                if fieldValue is byte[] {
                    receiverEmail = check string:fromBytes(fieldValue);
                }
            } else if fieldName == "message" {
                byte[]|error fieldValue = part.getByteArray();
                if fieldValue is byte[] {
                    message = check string:fromBytes(fieldValue);
                }
            } else if fieldName == "file" {
                byte[]|error fieldValue = part.getByteArray();
                if fieldValue is byte[] {
                    fileContent = fieldValue;
                    fileName = contentDisposition.fileName is string ? contentDisposition.fileName : "unknown_file";
                    string? partContentType = part.getContentType();
                    fileType = partContentType is string ? partContentType : "application/octet-stream";
                }
            }
        }
        
        // Validate required fields
        if roomId == "" || senderEmail == "" || receiverEmail == "" {
            return {
                "status": "error",
                "message": "Missing required fields: roomId, senderEmail, receiverEmail"
            };
        }
        
        if fileContent.length() == 0 {
            return {
                "status": "error",
                "message": "No file content provided"
            };
        }
        
        // Validate file type
        if !file:isValidFileType(fileName) {
            return {
                "status": "error",
                "message": "Unsupported file type: " + fileName
            };
        }
        
        // Upload file using existing file module
        file:UploadResponse|error uploadResult = file:uploadFile(fileContent, fileName, fileType, senderEmail);
        if uploadResult is error {
            io:println("❌ File upload failed: " + uploadResult.message());
            return {
                "status": "error",
                "message": "File upload failed: " + uploadResult.message()
            };
        }
        
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Save file message to database
        string fileMessage = message != "" ? message : "📎 " + fileName;
        string|error messageId = chat:saveFileMessageToDB(
            btuDb,
            roomId,
            senderEmail,
            receiverEmail,
            fileMessage,
            uploadResult.fileUrl,
            fileName,
            uploadResult.metadata.fileSize.toString(),
            fileType
        );
        
        if messageId is error {
            io:println("❌ Failed to save file message to DB: " + messageId.message());
            return http:INTERNAL_SERVER_ERROR;
        }
        
        // Save file metadata to files collection
        mongodb:Collection filesCollection = check btuDb->getCollection("files");
        map<json> fileRecord = {
            "fileId": uploadResult.fileId,
            "originalFileName": fileName,
            "fileUrl": uploadResult.fileUrl,
            "contentType": fileType,
            "fileSize": uploadResult.metadata.fileSize,
            "uploadedBy": senderEmail,
            "uploadTimestamp": uploadResult.metadata.uploadTimestamp,
            "bucketName": uploadResult.metadata.bucketName,
            "s3Key": uploadResult.metadata.s3Key,
            "status": "active",
            "relatedMessageId": messageId,
            "chatRoomId": roomId
        };
        
        check filesCollection->insertOne(fileRecord);
        
        return {
            "status": "success",
            "message": "File uploaded and message sent successfully",
            "messageId": messageId,
            "fileId": uploadResult.fileId,
            "fileUrl": uploadResult.fileUrl,
            "fileName": fileName,
            "fileSize": uploadResult.metadata.fileSize
        };
    }

}
