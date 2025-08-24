import ballerina/http;
import ballerina/io;
import ballerinax/mongodb;
import ballerina/websocket;
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

    // Create or get chat room between two users
    resource function post chat/room(@http:Payload json payload) returns json|http:BadRequest {
        json|error user1Result = payload.user1Id;
        json|error user2Result = payload.user2Id;
        
        if (user1Result is error || user2Result is error) {
            return <http:BadRequest>{body: {"error": "Missing user1Id or user2Id"}};
        }
        
        string user1Id = user1Result.toString();
        string user2Id = user2Result.toString();
        
        string roomId = chat:createOrGetRoom(user1Id, user2Id);
        
        return {
            "roomId": roomId,
            "users": [user1Id, user2Id],
            "message": "Chat room ready"
        };
    }

}

// WebSocket service for real-time chat
service /chat on new websocket:Listener(8081) {
    resource function get .(http:Request req, string userId, string roomId) returns websocket:Service|websocket:UpgradeError {
        return new ChatService(userId, roomId);
    }
}

service class ChatService {
    *websocket:Service;
    private string userId;
    private string roomId;

    function init(string userId, string roomId) {
        self.userId = userId;
        self.roomId = roomId;
    }

    remote function onOpen(websocket:Caller caller) returns websocket:Error? {
        boolean success = chat:addClientToRoom(caller, self.userId, self.roomId);
        if (!success) {
            return error("Failed to join room: " + self.roomId);
        }
        
        // Notify user they've joined
        json joinMessage = {
            "type": "system",
            "message": "Connected to chat room",
            "roomId": self.roomId
        };
        check caller->writeTextMessage(joinMessage.toString());
    }

    remote function onTextMessage(websocket:Caller caller, string text) returns websocket:Error? {
        // Parse message (expect JSON with message content)
        json|error messageJson = text.fromJsonString();
        if (messageJson is json) {
            json|error messageContent = messageJson.message;
            if (messageContent is json) {
                chat:sendMessageToRoom(caller, self.userId, messageContent.toString(), self.roomId);
            }
        }
    }

    remote function onClose(websocket:Caller caller, int statusCode, string reason) {
        chat:removeClientFromRoom(caller, self.userId);
        io:println("User " + self.userId + " disconnected from room " + self.roomId);
    }

    remote function onError(websocket:Caller caller, error err) {
        io:println("WebSocket error: " + err.message());
        chat:removeClientFromRoom(caller, self.userId);
    }

}
