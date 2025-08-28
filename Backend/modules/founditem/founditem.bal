import ballerina/io;
import ballerina/time;
import ballerina/uuid;
import ballerinax/mongodb;

// Found Item Data Structure for the Database
public type FoundItemDb record {|
    string itemId;
    string finderEmail;
    string finderName;
    string finderPhone;
    string itemName;
    string itemDescription;
    string category; // electronics, clothing, accessories, etc.
    string[] itemImages?; // optional array of image URLs
    string foundDate; // when the item was found
    string reportDate; // when it was reported
    LocationInfo foundLocation;
    string status; // "found", "returned", "claimed"
    string additionalNotes?;
    string lastUpdated;
|};

// Location Information (reusing a similar structure)
public type LocationInfo record {|
    string address;
    string city;
    string state;
    string country;
    decimal latitude;
    decimal longitude;
    string landmark?; // nearby landmark
|};

// Request type for the API when reporting a found item
public type ReportFoundItemRequest record {|
    string finderEmail;
    string finderName;
    string finderPhone;
    string itemName;
    string itemDescription;
    string category;
    string[] itemImages?;
    string foundDate;
    LocationInfo foundLocation;
    string additionalNotes?;
|};

// Function to handle reporting a found item
public function reportFoundItem(mongodb:Database db, ReportFoundItemRequest request) returns json|error {
    // Get the "founditems" collection from the database
    mongodb:Collection foundItemsCollection = check db->getCollection("founditems");
    
    string itemId = uuid:createType1AsString();
    string currentTimestamp = time:utcNow()[0].toString();
    
    // Create a new FoundItemDb record from the request
    FoundItemDb foundItem = {
        itemId: itemId,
        finderEmail: request.finderEmail,
        finderName: request.finderName,
        finderPhone: request.finderPhone,
        itemName: request.itemName,
        itemDescription: request.itemDescription,
        category: request.category,
        itemImages: request.itemImages,
        foundDate: request.foundDate,
        reportDate: currentTimestamp,
        foundLocation: request.foundLocation,
        status: "found", // Initial status is "found"
        additionalNotes: request.additionalNotes,
        lastUpdated: currentTimestamp
    };
    
    // Insert the new record into the database
    check foundItemsCollection->insertOne(foundItem);
    
    io:println("✅ Found item reported: " + itemId + " - " + request.itemName + " by " + request.finderEmail);
    
    // Return a success response
    return {
        "status": "success",
        "message": "Found item reported successfully",
        "itemId": itemId,
        "item": {
            "itemName": request.itemName,
            "category": request.category,
            "status": "found"
        }
    };
}