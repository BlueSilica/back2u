import ballerina/crypto;
import ballerina/time;
import ballerina/http;
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

// Handle user login
public function handleUserLogin(mongodb:Database db, LoginRequest loginRequest) returns json|http:BadRequest|http:InternalServerError {
    // Get user by email
    User|error? userResult = getUserByEmail(db, loginRequest.email);
    if userResult is error {
        return http:INTERNAL_SERVER_ERROR;
    }
    
    if userResult is () {
        json errorResponse = {"error": "Invalid email or password"};
        return <http:BadRequest>{body: errorResponse};
    }
    
    User user = <User>userResult;
    
    // Verify password
    boolean|error passwordValid = verifyPassword(loginRequest.password, user.passwordHash);
    if passwordValid is error {
        return http:INTERNAL_SERVER_ERROR;
    }
    
    if !passwordValid {
        json errorResponse = {"error": "Invalid email or password"};
        return <http:BadRequest>{body: errorResponse};
    }
    
    // Return success response (without password hash)
    json response = {
        "message": "Login successful",
        "user": {
            "_id": user._id,
            "email": user.email,
            "phoneNumber": user.phoneNumber,
            "address": {
                "number": user.address.number,
                "address": user.address.address,
                "postalCode": user.address.postalCode,
                "city": user.address.city,
                "country": user.address.country
            },
            "firstName": user.firstName,
            "lastName": user.lastName,
            "picURL": user.picURL,
            "createdAt": user.createdAt.toString()
        }
    };
    
    return response;
}