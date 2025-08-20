import ballerina/crypto;
import ballerina/time;
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

// Hash password function
public function hashPassword(string password) returns string|error {
    byte[] hashedPassword = crypto:hashSha256(password.toBytes());
    return hashedPassword.toBase64();
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