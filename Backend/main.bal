import ballerina/http;
import ballerina/io;
import ballerinax/mongodb;

// Global MongoDB client
final mongodb:Client mongoDb = check new ({
    connection: "mongodb+srv://adeepashashintha:0C71Gbok4YgQgKgb@cluster0.wapt0hl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
});

// Test MongoDB connection on startup
public function main() {
    // Test connection by listing databases
    var result = mongoDb->listDatabaseNames();
    if result is error {
        io:println("MongoDB connection failed: " + result.message());
    } else {
        io:println("MongoDB connection successful!");
        io:println("Available databases: ", result);
        
        // Create database "btu" by creating a collection in it
        var btuDb = mongoDb->getDatabase("btu");
        if btuDb is error {
            io:println("Failed to get btu database: " + btuDb.message());
            return;
        }
        
        var usersCollection = btuDb->getCollection("users");
        if usersCollection is error {
            io:println("Failed to get users collection: " + usersCollection.message());
            return;
        }
        
        // Insert a dummy document to create the database (MongoDB creates DB when first document is inserted)
        map<json> sampleDoc = {
            "_id": "init",
            "message": "Database btu initialized",
            "createdAt": "2025-08-20"
        };
        
        var insertResult = usersCollection->insertOne(sampleDoc);
        if insertResult is error {
            io:println("Failed to create btu database: " + insertResult.message());
        } else {
            io:println("Database 'btu' created successfully!");
            io:println("Sample document inserted successfully");
        }
    }
}

// HTTP service running on port 8080
service / on new http:Listener(8080) {
    
    // Health check endpoint
    resource function get health() returns json {
        return {"status": "OK", "message": "Server is running on port 8080"};
    }

}
