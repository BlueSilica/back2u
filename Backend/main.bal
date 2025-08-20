import ballerinax/mongodb;
import ballerina/io;

// These are declarations only; actual values are provided via Config.toml at runtime.
configurable string mongodbUri = ?;       // e.g., set in Config.toml as mongodbUri = "..."
configurable string dbName = ?;
configurable string collName = ?;

public function main() returns error? {
    // Create MongoDB client
    mongodb:Client mongoClient = check new ({ connectionString: mongodbUri });

    // Get DB and a collection
    mongodb:Database database = check mongoClient->getDatabase(dbName);
    mongodb:Collection coll = check database->getCollection(collName);

    // Do a simple operation to verify connectivity
    // insertOne expects a record, not generic json
    record {| int ping; |} doc = { ping: 1 };
    check coll->insertOne(doc);

    int count = check coll->countDocuments({});
    io:println("Connected to MongoDB Atlas. '" + collName + "' count: " + count.toString());

    // Close at the end
    check mongoClient->close();
}