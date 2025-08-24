import ballerina/http;
import ballerina/io;
import ballerinax/mongodb;
import Backend.user;
import Backend.chat;

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

}
