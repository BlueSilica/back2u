import ballerina/websocket;
import ballerina/io;
import ballerina/uuid;
import ballerina/time;

// Chat room record
public type ChatRoom record {
    string roomId;
    string[] userIds;
    websocket:Caller[] clients;
    string createdAt;
};

// Store active chat rooms
ChatRoom[] chatRooms = [];

// Store user to room mapping
map<string> userToRoom = {};

// Create or get existing room between two users
public function createOrGetRoom(string userId1, string userId2) returns string {
    // Check if room already exists between these users
    foreach ChatRoom room in chatRooms {
        if (room.userIds.length() == 2 && 
            ((room.userIds[0] == userId1 && room.userIds[1] == userId2) ||
             (room.userIds[0] == userId2 && room.userIds[1] == userId1))) {
            return room.roomId;
        }
    }
    
    // Create new room
    string roomId = uuid:createType1AsString();
    ChatRoom newRoom = {
        roomId: roomId,
        userIds: [userId1, userId2],
        clients: [],
        createdAt: time:utcNow()[0].toString()
    };
    
    chatRooms.push(newRoom);
    userToRoom[userId1] = roomId;
    userToRoom[userId2] = roomId;
    
    io:println("🏠 New chat room created: " + roomId + " for users: " + userId1 + ", " + userId2);
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

// Get number of active rooms
public function getActiveRoomsCount() returns int {
    return chatRooms.length();
}
