import ballerina/http;
import ballerina/io;
import ballerinax/mongodb;
import Backend.user;

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

}
