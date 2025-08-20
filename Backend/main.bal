import ballerina/http;
import ballerina/io;
import ballerinax/mongodb;
import Backend.user;

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

    // Create user endpoint
    resource function post users(@http:Payload user:CreateUserRequest userRequest) returns json|http:BadRequest|http:InternalServerError {
        // Get database
        mongodb:Database|error btuDbResult = mongoDb->getDatabase("btu");
        if btuDbResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        mongodb:Database btuDb = btuDbResult;
        
        // Check if email already exists
        boolean|error emailExistsResult = user:emailExists(btuDb, userRequest.email);
        if emailExistsResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        
        if emailExistsResult {
            json errorResponse = {"error": "Email already exists"};
            return <http:BadRequest>{body: errorResponse};
        }

        // Create user using the user module
        user:User|error userResult = user:createUser(btuDb, userRequest);
        if userResult is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        
        user:User newUser = userResult;
        
        // Return success response (without password hash)
        json response = {
            "message": "User created successfully",
            "user": {
                "email": newUser.email,
                "phoneNumber": newUser.phoneNumber,
                "address": {
                    "number": newUser.address.number,
                    "address": newUser.address.address,
                    "postalCode": newUser.address.postalCode,
                    "city": newUser.address.city,
                    "country": newUser.address.country
                },
                "firstName": newUser.firstName,
                "lastName": newUser.lastName,
                "picURL": newUser.picURL,
                "createdAt": newUser.createdAt.toString()
            }
        };
        
        return response;
    }

}
