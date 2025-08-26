import ballerina/crypto;
import ballerina/time;
import ballerina/http;
import ballerina/io;
import ballerinax/mongodb;

// User address record
public type Address record {
    string number;
    string address;
    string postalCode;
    string city;
    string country;
};

// User record for creation
public type CreateUserRequest record {
    string email;
    string phoneNumber;
    Address address;
    string password;
    string firstName?;
    string lastName?;
    string picURL?;
};

// User record stored in database
public type User record {
    string _id?;
    string email;
    string phoneNumber;
    Address address;
    string passwordHash;
    string firstName?;
    string lastName?;
    string picURL?;
    time:Utc createdAt;
    time:Utc updatedAt;
};

// User login request
public type LoginRequest record {
    string email;
    string password;
};

// Login response
public type LoginResponse record {
    string message;
    json user;
    string token?;
};

// Response types
public type UserResponse record {
    string message;
    json user;
};

public type ErrorResponse record {
    string 'error;
};

// Hash password function
public function hashPassword(string password) returns string|error {
    byte[] hashedPassword = crypto:hashSha256(password.toBytes());
    return hashedPassword.toBase64();
}

// Verify password function
public function verifyPassword(string password, string hashedPassword) returns boolean|error {
    string newHash = check hashPassword(password);
    return newHash == hashedPassword;
}

// Create user function
public function createUser(mongodb:Database db, CreateUserRequest userRequest) returns User|error {
    // Hash the password
    string hashedPassword = check hashPassword(userRequest.password);
    
    // Get current time
    time:Utc currentTime = time:utcNow();
    
    // Create user object
    User newUser = {
        email: userRequest.email,
        phoneNumber: userRequest.phoneNumber,
        address: userRequest.address,
        passwordHash: hashedPassword,
        firstName: userRequest.firstName,
        lastName: userRequest.lastName,
        picURL: userRequest.picURL,
        createdAt: currentTime,
        updatedAt: currentTime
    };
    
    // Get users collection
    mongodb:Collection usersCollection = check db->getCollection("users");
    
    // Insert user
    check usersCollection->insertOne(newUser);
    
    return newUser;
}

// Check if email exists
public function emailExists(mongodb:Database db, string email) returns boolean|error {
    mongodb:Collection usersCollection = check db->getCollection("users");
    User? result = check usersCollection->findOne({email: email});
    return result is User;
}

// Complete user creation service function
public function handleCreateUser(mongodb:Database db, CreateUserRequest userRequest) returns json|http:BadRequest|http:InternalServerError {
    // Check if email already exists
    boolean|error emailExistsResult = emailExists(db, userRequest.email);
    if emailExistsResult is error {
        return http:INTERNAL_SERVER_ERROR;
    }
    
    if emailExistsResult {
        json errorResponse = {"error": "Email already exists"};
        return <http:BadRequest>{body: errorResponse};
    }

    // Create user
    User|error userResult = createUser(db, userRequest);
    if userResult is error {
        return http:INTERNAL_SERVER_ERROR;
    }
    
    User newUser = userResult;
    
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

// Get user by email function
public function getUserByEmail(mongodb:Database db, string email) returns User|error? {
    mongodb:Collection usersCollection = check db->getCollection("users");
    User? result = check usersCollection->findOne({email: email});
    return result;
}

// Get all users function
public function getAllUsers(mongodb:Database db) returns json[]|error {
    mongodb:Collection usersCollection = check db->getCollection("users");
    stream<record {}, error?> userStream = check usersCollection->find();
    json[] users = [];
    
    error? result = userStream.forEach(function(record {} user) {
        users.push(user.toJson());
    });
    
    if result is error {
        return result;
    }
    
    check userStream.close();
    return users;
}

// Handle get all users
public function handleGetAllUsers(mongodb:Database db) returns json|http:InternalServerError {
    json[]|error usersResult = getAllUsers(db);
    if usersResult is error {
        return http:INTERNAL_SERVER_ERROR;
    }
    
    json[] users = usersResult;
    
    json response = {
        "message": "Users retrieved successfully",
        "users": users
    };
    
    return response;
}

// Get user by email function (return JSON)
// Get user by email (internal function)
function getUserByEmailAsJson(mongodb:Database db, string email) returns record {}|error? {
    mongodb:Collection usersCollection = check db->getCollection("users");
    record {}? result = check usersCollection->findOne({email: email});
    
    if result is record {} {
        io:println("📝 Raw MongoDB record keys: " + result.keys().toString());
        // Check if _id exists in the record
        if result.hasKey("_id") {
            io:println("✅ _id field found in MongoDB record");
        } else {
            io:println("❌ _id field NOT found in MongoDB record");
        }
    }
    
    return result;
}

// Get user by ID
public function getUserById(mongodb:Database db, string userId) returns json|error {
    mongodb:Collection usersCollection = check db->getCollection("users");
    
    // Create ObjectId filter for MongoDB
    map<json> filter = {"_id": {"$oid": userId}};
    
    record {}? result = check usersCollection->findOne(filter);
    if result is () {
        return error("User not found with ID: " + userId);
    }
    
    // Convert to JSON and return (password hash handling will be done at API level)
    return result.toJson();
}

// Get user by email (for chat partner lookup)
public function getUserByEmailForChat(mongodb:Database db, string email) returns json|error {
    mongodb:Collection usersCollection = check db->getCollection("users");
    record {}? result = check usersCollection->findOne({email: email});
    if result is () {
        return error("User not found with email: " + email);
    }
    
    // Convert to JSON and return (password hash handling will be done at API level)
    return result.toJson();
}

// User update request
public type UpdateUserRequest record {
    string email?;
    string phoneNumber?;
    Address address?;
    string firstName?;
    string lastName?;
    string picURL?;
};

// Handle user login
public function handleUserLogin(mongodb:Database db, LoginRequest loginRequest) returns json|http:BadRequest|http:InternalServerError {
    // Get user by email as record
    record {}|error? userResult = getUserByEmailAsJson(db, loginRequest.email);
    if userResult is error {
        return http:INTERNAL_SERVER_ERROR;
    }
    
    if userResult is () {
        json errorResponse = {"error": "Invalid email or password"};
        return <http:BadRequest>{body: errorResponse};
    }
    
    record {} user = <record {}>userResult;
    
    // Try to get _id from the record before converting to JSON
    anydata|error idValue = user["_id"];
    io:println("🔍 _id value from record: " + (idValue is error ? "ERROR" : idValue.toString()));
    
    json userJson = user.toJson();
    
    // Debug: Print what we got from MongoDB
    io:println("🔍 Raw user from MongoDB: " + userJson.toString());
    
    // Get password hash from user JSON
    json|error passwordHashResult = userJson.passwordHash;
    if passwordHashResult is error {
        return http:INTERNAL_SERVER_ERROR;
    }
    string passwordHash = passwordHashResult.toString();
    
    // Verify password
    boolean|error passwordValid = verifyPassword(loginRequest.password, passwordHash);
    if passwordValid is error {
        return http:INTERNAL_SERVER_ERROR;
    }
    
    if !passwordValid {
        json errorResponse = {"error": "Invalid email or password"};
        return <http:BadRequest>{body: errorResponse};
    }
    
    // Return success response - create a new JSON object without password hash
    map<json> userMap = <map<json>>userJson;
    
    // Create response user object excluding password hash
    map<json> responseUserMap = {};
    
    // Copy all fields except passwordHash
    foreach var [key, value] in userMap.entries() {
        if key != "passwordHash" {
            responseUserMap[key] = value;
            io:println("📝 Copying field: " + key + " = " + value.toString());
        }
    }
    
    io:println("🎯 Final response user keys: " + responseUserMap.keys().toString());
    
    json response = {
        "message": "Login successful",
        "user": responseUserMap
    };
    
    return response;
}

// Update user function
public function updateUser(mongodb:Database db, string userId, UpdateUserRequest updateRequest) returns User|error {
    io:println("🔄 updateUser function called");
    io:println("📍 User ID: " + userId);
    
    mongodb:Collection usersCollection = check db->getCollection("users");
    
    // Create ObjectId filter for MongoDB
    map<json> filter = {"_id": {"$oid": userId}};
    io:println("🔍 Filter: " + filter.toString());
    
    // Build update document
    map<json> updateDoc = {};
    
    if updateRequest.email is string {
        updateDoc["email"] = updateRequest.email;
        io:println("📧 Email to update: " + updateRequest.email.toString());
    }
    if updateRequest.phoneNumber is string {
        updateDoc["phoneNumber"] = updateRequest.phoneNumber;
        io:println("📱 Phone to update: " + updateRequest.phoneNumber.toString());
    }
    if updateRequest.address is Address {
        Address addr = <Address>updateRequest.address;
        updateDoc["address"] = {
            "number": addr.number,
            "address": addr.address,
            "postalCode": addr.postalCode,
            "city": addr.city,
            "country": addr.country
        };
        io:println("🏠 Address to update: " + addr.toString());
    }
    if updateRequest.firstName is string {
        updateDoc["firstName"] = updateRequest.firstName;
        io:println("👤 First name to update: " + updateRequest.firstName.toString());
    }
    if updateRequest.lastName is string {
        updateDoc["lastName"] = updateRequest.lastName;
        io:println("👤 Last name to update: " + updateRequest.lastName.toString());
    }
    if updateRequest.picURL is string {
        updateDoc["picURL"] = updateRequest.picURL;
        io:println("🖼️ Picture URL to update: " + updateRequest.picURL.toString());
    }
    
    // Add updatedAt timestamp
    updateDoc["updatedAt"] = time:utcNow();
    
    io:println("📝 Final update document: " + updateDoc.toString());
    
    // Perform update
    mongodb:UpdateResult updateResult = check usersCollection->updateOne(filter, {"$set": updateDoc});
    
    io:println("📊 Update result - matched: " + updateResult.matchedCount.toString() + ", modified: " + updateResult.modifiedCount.toString());
    
    if updateResult.modifiedCount == 0 {
        if updateResult.matchedCount == 0 {
            return error("No user found with ID: " + userId);
        } else {
            return error("No changes made to user with ID: " + userId);
        }
    }
    
    // Get updated user
    record {}? updatedUserRecord = check usersCollection->findOne(filter);
    if updatedUserRecord is () {
        return error("User not found after update");
    }
    
    io:println("✅ User record retrieved after update");
    
    // Convert to User type
    json updatedUserJson = updatedUserRecord.toJson();
    User updatedUser = check updatedUserJson.cloneWithType(User);
    
    return updatedUser;
}

// Handle user update
public function handleUpdateUser(mongodb:Database db, string userId, UpdateUserRequest updateRequest) returns json|http:BadRequest|http:InternalServerError {
    io:println("🔧 Starting handleUpdateUser...");
    io:println("📍 User ID received: " + userId);
    io:println("📝 Update request: " + updateRequest.toString());
    
    // Update user
    User|error updateResult = updateUser(db, userId, updateRequest);
    if updateResult is error {
        io:println("❌ Update error: " + updateResult.message());
        if updateResult.message().includes("No user found") {
            json errorResponse = {"error": "User not found or no changes made"};
            return <http:BadRequest>{body: errorResponse};
        }
        return http:INTERNAL_SERVER_ERROR;
    }
    
    User updatedUser = updateResult;
    io:println("✅ User updated successfully");
    
    // Return success response (without password hash)
    json response = {
        "message": "User updated successfully",
        "user": {
            "_id": updatedUser._id,
            "email": updatedUser.email,
            "phoneNumber": updatedUser.phoneNumber,
            "address": {
                "number": updatedUser.address.number,
                "address": updatedUser.address.address,
                "postalCode": updatedUser.address.postalCode,
                "city": updatedUser.address.city,
                "country": updatedUser.address.country
            },
            "firstName": updatedUser.firstName,
            "lastName": updatedUser.lastName,
            "picURL": updatedUser.picURL,
            "createdAt": updatedUser.createdAt.toString(),
            "updatedAt": updatedUser.updatedAt.toString()
        }
    };
    
    return response;
}