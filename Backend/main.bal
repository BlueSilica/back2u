import ballerinax/mongodb;
import ballerina/io;

public function main() returns error? {
    // Use the config record style
    mongodb:Client mongoDb = check new ({
        connection: "mongodb+srv://adeepashashintha:0C71Gbok4YgQgKgb@cluster0.wapt0hl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    });

    // Select your database
    mongodb:Database db = check mongoDb->getDatabase("backtou");

    // Access a collection inside the database
    mongodb:Collection coll = check db->getCollection("users");

    io:println("✅ Connected to MongoDB Atlas and inserted a user!");
}
