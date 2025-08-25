import ballerina/websocket;
import ballerina/io;
import ballerina/uuid;
import ballerina/time;
import ballerinax/mongodb;

// Chat room record for in-memory storage
public type ChatRoom record {
    string roomId;
    string[] userIds;
    websocket:Caller[] clients;
    string createdAt;
};

// Chat room record for database storage
public type ChatRoomDb record {
    json _id?; // MongoDB ObjectId can be complex JSON
    string roomId;
    string[] userIds;
    string createdAt;
    string status; // "active", "inactive"
};

// Message record for database storage
public type MessageDb record {
    json _id?; // MongoDB ObjectId
    string messageId;
    string roomId;
    string senderEmail;
    string receiverEmail;
    string message;
    string timestamp;
    string status; // "sent", "delivered", "read"
    string messageType?; // "text", "file", "image"
    string fileUrl?; // URL of uploaded file (if messageType is "file" or "image")
    string fileName?; // Original file name
    string fileSize?; // File size in bytes
    string contentType?; // MIME type of the file
};

// Store active chat rooms
ChatRoom[] chatRooms = [];

// Store user to room mapping
map<string> userToRoom = {};

// Create or get existing room between two users (with database persistence) - using emails
public function createOrGetRoom(string userEmail1, string userEmail2, mongodb:Database db) returns string|error {
    // Get chatrooms collection
    mongodb:Collection chatRoomsCollection = check db->getCollection("chatrooms");
    
    // Check if room already exists in database
    map<json> filter = {
        "$or": [
            {
                "$and": [
                    {"userIds.0": userEmail1},
                    {"userIds.1": userEmail2}
                ]
            },
            {
                "$and": [
                    {"userIds.0": userEmail2},
                    {"userIds.1": userEmail1}
                ]
            }
        ],
        "status": "active"
    };
    
    stream<ChatRoomDb, error?> findResult = check chatRoomsCollection->find(filter);
    ChatRoomDb[] existingRooms = check from ChatRoomDb room in findResult select room;
    
    if existingRooms.length() > 0 {
        string existingRoomId = existingRooms[0].roomId;
        
        // Also check/add to in-memory storage
        boolean foundInMemory = false;
        foreach ChatRoom room in chatRooms {
            if room.roomId == existingRoomId {
                foundInMemory = true;
                break;
            }
        }
        
        if !foundInMemory {
            // Add to in-memory storage
            ChatRoom memoryRoom = {
                roomId: existingRoomId,
                userIds: [userEmail1, userEmail2],
                clients: [],
                createdAt: existingRooms[0].createdAt
            };
            chatRooms.push(memoryRoom);
            userToRoom[userEmail1] = existingRoomId;
            userToRoom[userEmail2] = existingRoomId;
        }
        
        io:println("🔄 Existing chat room retrieved: " + existingRoomId + " for emails: " + userEmail1 + ", " + userEmail2);
        return existingRoomId;
    }
    
    // Create new room
    string roomId = uuid:createType1AsString();
    string timestamp = time:utcNow()[0].toString();
    
    // Create database record
    ChatRoomDb dbRoom = {
        roomId: roomId,
        userIds: [userEmail1, userEmail2],
        createdAt: timestamp,
        status: "active"
    };
    
    // Insert into database
    check chatRoomsCollection->insertOne(dbRoom);
    
    // Create in-memory record
    ChatRoom newRoom = {
        roomId: roomId,
        userIds: [userEmail1, userEmail2],
        clients: [],
        createdAt: timestamp
    };
    
    chatRooms.push(newRoom);
    userToRoom[userEmail1] = roomId;
    userToRoom[userEmail2] = roomId;
    
    io:println("🏠 New chat room created and saved to DB: " + roomId + " for emails: " + userEmail1 + ", " + userEmail2);
    return roomId;
}

// Add client to a specific room
public function addClientToRoom(websocket:Caller caller, string userId, string roomId) returns boolean {
    lock {
        // Find the room
        foreach int i in 0 ..< chatRooms.length() {
            if (chatRooms[i].roomId == roomId) {
                ChatRoom room = chatRooms[i];
                
                // Check if user is allowed in this room
                boolean userAllowed = false;
                foreach string allowedUserId in room.userIds {
                    if (allowedUserId == userId) {
                        userAllowed = true;
                        break;
                    }
                }
                
                if (!userAllowed) {
                    return false; // User not authorized for this room
                }
                
                // Add client to room
                room.clients.push(caller);
                
                // Update user mapping
                userToRoom[userId] = roomId;
                
                io:println("✅ User " + userId + " joined room " + roomId);
                return true;
            }
        }
        
        return false; // Room doesn't exist
    }
}

// Remove client from room
public function removeClientFromRoom(websocket:Caller caller, string userId) {
    lock {
        string? roomId = userToRoom[userId];
        if (roomId is string) {
            foreach int i in 0 ..< chatRooms.length() {
                if (chatRooms[i].roomId == roomId) {
                    // Remove caller from clients array
                    int clientIndex = 0;
                    while (clientIndex < chatRooms[i].clients.length()) {
                        if (chatRooms[i].clients[clientIndex] === caller) {
                            _ = chatRooms[i].clients.remove(clientIndex);
                            break;
                        }
                        clientIndex += 1;
                    }
                    
                    // Remove user mapping
                    _ = userToRoom.remove(userId);
                    
                    io:println("❌ User " + userId + " left room: " + roomId);
                    break;
                }
            }
        }
    }
}

// Send message to all clients in a room (except sender)
public function sendMessageToRoom(websocket:Caller sender, string senderUserId, string message, string roomId) {
    websocket:Caller[] clientsToSend = [];
    string messageStr = "";
    
    lock {
        foreach int i in 0 ..< chatRooms.length() {
            if (chatRooms[i].roomId == roomId) {
                ChatRoom room = chatRooms[i];
                
                json messageJson = {
                    "type": "message",
                    "userId": senderUserId,
                    "message": message,
                    "roomId": roomId,
                    "timestamp": time:utcNow()[0].toString()
                };
                messageStr = messageJson.toString();
                
                // Collect clients to send to (except sender)
                foreach int j in 0 ..< room.clients.length() {
                    if (room.clients[j] !== sender) {
                        clientsToSend.push(room.clients[j]);
                    }
                }
                break;
            }
        }
    }
    
    // Send messages outside the lock
    foreach websocket:Caller caller in clientsToSend {
        var result = caller->writeTextMessage(messageStr);
        if (result is error) {
            io:println("❌ Failed to send message: " + result.message());
        }
    }
    
    if (clientsToSend.length() > 0) {
        io:println("💬 Message sent in room " + roomId + " by " + senderUserId);
    }
}

// Helper function to send message asynchronously
function sendMessage(websocket:Caller caller, string message) {
    var result = caller->writeTextMessage(message);
    if (result is error) {
        io:println("❌ Failed to send message: " + result.message());
    }
}

// Get room info
public function getRoomInfo(string roomId) returns ChatRoom? {
    foreach ChatRoom room in chatRooms {
        if (room.roomId == roomId) {
            return room;
        }
    }
    return ();
}

// Get user's active room
public function getUserRoom(string userId) returns string? {
    return userToRoom[userId];
}

// Load existing chat rooms from database on startup
public function loadChatRoomsFromDB(mongodb:Database db) returns error? {
    mongodb:Collection chatRoomsCollection = check db->getCollection("chatrooms");
    
    // Find all active chat rooms
    map<json> filter = {"status": "active"};
    stream<ChatRoomDb, error?> findResult = check chatRoomsCollection->find(filter);
    ChatRoomDb[] dbRooms = check from ChatRoomDb room in findResult select room;
    
    foreach ChatRoomDb dbRoom in dbRooms {
        // Add to in-memory storage
        ChatRoom memoryRoom = {
            roomId: dbRoom.roomId,
            userIds: dbRoom.userIds,
            clients: [],
            createdAt: dbRoom.createdAt
        };
        
        chatRooms.push(memoryRoom);
        
        // Update user mappings
        foreach string userId in dbRoom.userIds {
            userToRoom[userId] = dbRoom.roomId;
        }
    }
    
    io:println("📚 Loaded " + dbRooms.length().toString() + " chat rooms from database");
}

// Get all chat rooms from database
public function getAllChatRoomsFromDB(mongodb:Database db) returns ChatRoomDb[]|error {
    mongodb:Collection chatRoomsCollection = check db->getCollection("chatrooms");
    
    stream<ChatRoomDb, error?> findResult = check chatRoomsCollection->find({});
    ChatRoomDb[] rooms = check from ChatRoomDb room in findResult select room;
    
    return rooms;
}

// Get chat rooms for a specific user from database - using email
public function getUserChatRoomsFromDB(mongodb:Database db, string userEmail) returns ChatRoomDb[]|error {
    mongodb:Collection chatRoomsCollection = check db->getCollection("chatrooms");
    
    // Find rooms where the user email is in the userIds array
    map<json> filter = {
        "userIds": userEmail,
        "status": "active"
    };
    
    stream<ChatRoomDb, error?> findResult = check chatRoomsCollection->find(filter);
    ChatRoomDb[] rooms = check from ChatRoomDb room in findResult select room;
    
    return rooms;
}

// Get number of active rooms
public function getActiveRoomsCount() returns int {
    return chatRooms.length();
}

// Save message to database
public function saveMessageToDB(mongodb:Database db, string roomId, string senderEmail, string receiverEmail, string message) returns string|error {
    mongodb:Collection messagesCollection = check db->getCollection("messages");
    
    string messageId = uuid:createType1AsString();
    string timestamp = time:utcNow()[0].toString();
    
    MessageDb messageRecord = {
        messageId: messageId,
        roomId: roomId,
        senderEmail: senderEmail,
        receiverEmail: receiverEmail,
        message: message,
        timestamp: timestamp,
        status: "sent",
        messageType: "text"
    };
    
    // Insert into database
    check messagesCollection->insertOne(messageRecord);
    
    io:println("💾 Message saved to DB: " + messageId + " from " + senderEmail + " to " + receiverEmail + " in room " + roomId);
    return messageId;
}

// Save file message to database
public function saveFileMessageToDB(mongodb:Database db, string roomId, string senderEmail, string receiverEmail, string message, string fileUrl, string fileName, string fileSize, string contentType) returns string|error {
    mongodb:Collection messagesCollection = check db->getCollection("messages");
    
    string messageId = uuid:createType1AsString();
    string timestamp = time:utcNow()[0].toString();
    
    // Determine message type based on content type
    string messageType = "file";
    if contentType.startsWith("image/") {
        messageType = "image";
    }
    
    MessageDb messageRecord = {
        messageId: messageId,
        roomId: roomId,
        senderEmail: senderEmail,
        receiverEmail: receiverEmail,
        message: message,
        timestamp: timestamp,
        status: "sent",
        messageType: messageType,
        fileUrl: fileUrl,
        fileName: fileName,
        fileSize: fileSize,
        contentType: contentType
    };
    
    // Insert into database
    check messagesCollection->insertOne(messageRecord);
    
    io:println("📎 File message saved to DB: " + messageId + " (" + fileName + ") from " + senderEmail + " to " + receiverEmail + " in room " + roomId);
    return messageId;
}

// Get messages for a chat room
public function getMessagesForRoom(mongodb:Database db, string roomId) returns MessageDb[]|error {
    mongodb:Collection messagesCollection = check db->getCollection("messages");
    
    // Find messages for the room, sorted by timestamp (ascending for chronological order)
    map<json> filter = {"roomId": roomId};
    
    stream<MessageDb, error?> findResult = check messagesCollection->find(filter);
    MessageDb[] messages = check from MessageDb message in findResult select message;
    
    return messages;
}

// Get recent messages between two users
public function getMessagesBetweenUsers(mongodb:Database db, string userEmail1, string userEmail2) returns MessageDb[]|error {
    mongodb:Collection messagesCollection = check db->getCollection("messages");
    
    // Find messages between two users (in both directions)
    map<json> filter = {
        "$or": [
            {
                "$and": [
                    {"senderEmail": userEmail1},
                    {"receiverEmail": userEmail2}
                ]
            },
            {
                "$and": [
                    {"senderEmail": userEmail2},
                    {"receiverEmail": userEmail1}
                ]
            }
        ]
    };
    
    stream<MessageDb, error?> findResult = check messagesCollection->find(filter);
    MessageDb[] messages = check from MessageDb message in findResult select message;
    
    return messages;
}

// Get new messages for a room since a specific timestamp (for real-time polling)
public function getNewMessagesForRoomSince(mongodb:Database db, string roomId, string sinceTimestamp) returns MessageDb[]|error {
    mongodb:Collection messagesCollection = check db->getCollection("messages");
    
    // Find messages for the room that are newer than the given timestamp
    map<json> filter = {
        "roomId": roomId,
        "timestamp": {
            "$gt": sinceTimestamp
        }
    };
    
    stream<MessageDb, error?> findResult = check messagesCollection->find(filter);
    MessageDb[] messages = check from MessageDb message in findResult select message;
    
    io:println("🔍 Found " + messages.length().toString() + " new messages for room " + roomId + " since " + sinceTimestamp);
    return messages;
}
