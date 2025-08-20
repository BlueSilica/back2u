import ballerina/http;
import ballerina/io;
import ballerinax/mongodb;

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
service / on new http:Listener(8080) {
    
    // Health check endpoint
    resource function get health() returns json {
        return {"status": "OK", "message": "Server is running on port 8080"};
    }

}
