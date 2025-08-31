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

// Function to get all found items with optional filtering
public function getAllFoundItems(mongodb:Database db, string? category = (), string? city = (), string? state = (), 
                                 string? status = ()) returns json|error {
    mongodb:Collection foundItemsCollection = check db->getCollection("founditems");
    
    // Build filter based on provided parameters
    map<json> filter = {};
    
    if category is string && category.trim() != "" {
        filter["category"] = category;
    }
    
    if city is string && city.trim() != "" {
        filter["foundLocation.city"] = city;
    }
    
    if state is string && state.trim() != "" {
        filter["foundLocation.state"] = state;
    }
    
    if status is string && status.trim() != "" {
        filter["status"] = status;
    } else {
        // Default: only show active found items
        filter["status"] = {"$in": ["found", "claimed"]};
    }
    
    io:println("🔍 Searching found items with filter: ", filter);
    
    stream<FoundItemDb, error?> findResult = check foundItemsCollection->find(filter);
    FoundItemDb[] foundItems = check from FoundItemDb item in findResult select item;
    
    // Convert to JSON response format
    json[] itemsJson = [];
    foreach FoundItemDb item in foundItems {
        json itemJson = {
            "itemId": item.itemId,
            "finderEmail": item.finderEmail,
            "finderName": item.finderName,
            "finderPhone": item.finderPhone,
            "itemName": item.itemName,
            "itemDescription": item.itemDescription,
            "category": item.category,
            "itemImages": item.itemImages,
            "foundDate": item.foundDate,
            "reportDate": item.reportDate,
            "foundLocation": item.foundLocation,
            "status": item.status,
            "additionalNotes": item.additionalNotes,
            "lastUpdated": item.lastUpdated
        };
        itemsJson.push(itemJson);
    }
    
    return {
        "status": "success",
        "message": "Found items retrieved successfully",
        "items": itemsJson,
        "totalItems": foundItems.length(),
        "filters": {
            "category": category,
            "city": city,
            "state": state,
            "status": status
        }
    };
}

// Function to get found item by ID
public function getFoundItemById(mongodb:Database db, string itemId) returns json|error {
    mongodb:Collection foundItemsCollection = check db->getCollection("founditems");
    
    map<json> filter = {"itemId": itemId};
    stream<FoundItemDb, error?> findResult = check foundItemsCollection->find(filter);
    FoundItemDb[] foundItems = check from FoundItemDb item in findResult select item;
    
    if foundItems.length() == 0 {
        return {
            "status": "error",
            "message": "Found item not found with ID: " + itemId
        };
    }
    
    FoundItemDb item = foundItems[0];
    
    return {
        "status": "success",
        "message": "Found item retrieved successfully",
        "item": {
            "itemId": item.itemId,
            "finderEmail": item.finderEmail,
            "finderName": item.finderName,
            "finderPhone": item.finderPhone,
            "itemName": item.itemName,
            "itemDescription": item.itemDescription,
            "category": item.category,
            "itemImages": item.itemImages,
            "foundDate": item.foundDate,
            "reportDate": item.reportDate,
            "foundLocation": item.foundLocation,
            "status": item.status,
            "additionalNotes": item.additionalNotes,
            "lastUpdated": item.lastUpdated
        }
    };
}

// Function to get found items by location (within radius)
public function getFoundItemsByLocation(mongodb:Database db, decimal latitude, decimal longitude, decimal radiusKm) returns json|error {
    mongodb:Collection foundItemsCollection = check db->getCollection("founditems");
    
    // MongoDB geospatial query for items within radius
    map<json> filter = {
        "foundLocation": {
            "$near": {
                "$geometry": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                },
                "$maxDistance": radiusKm * 1000 // Convert km to meters
            }
        },
        "status": {"$in": ["found", "claimed"]}
    };
    
    io:println("🌍 Searching found items by location: lat=" + latitude.toString() + ", lng=" + longitude.toString() + ", radius=" + radiusKm.toString() + "km");
    
    stream<FoundItemDb, error?> findResult = check foundItemsCollection->find(filter);
    FoundItemDb[] foundItems = check from FoundItemDb item in findResult select item;
    
    json[] itemsJson = [];
    foreach FoundItemDb item in foundItems {
        json itemJson = {
            "itemId": item.itemId,
            "finderEmail": item.finderEmail,
            "finderName": item.finderName,
            "itemName": item.itemName,
            "itemDescription": item.itemDescription,
            "category": item.category,
            "foundDate": item.foundDate,
            "foundLocation": item.foundLocation,
            "status": item.status,
            "additionalNotes": item.additionalNotes
        };
        itemsJson.push(itemJson);
    }
    
    return {
        "status": "success",
        "message": "Found items by location retrieved successfully",
        "items": itemsJson,
        "totalItems": foundItems.length(),
        "searchLocation": {
            "latitude": latitude,
            "longitude": longitude,
            "radiusKm": radiusKm
        }
    };
}

// Function to get found items by finder email
public function getFoundItemsByFinderEmail(mongodb:Database db, string finderEmail) returns json|error {
    mongodb:Collection foundItemsCollection = check db->getCollection("founditems");
    
    map<json> filter = {"finderEmail": finderEmail};
    stream<FoundItemDb, error?> findResult = check foundItemsCollection->find(filter);
    FoundItemDb[] foundItems = check from FoundItemDb item in findResult select item;
    
    json[] itemsJson = [];
    foreach FoundItemDb item in foundItems {
        json itemJson = {
            "itemId": item.itemId,
            "finderEmail": item.finderEmail,
            "finderName": item.finderName,
            "itemName": item.itemName,
            "itemDescription": item.itemDescription,
            "category": item.category,
            "foundDate": item.foundDate,
            "foundLocation": item.foundLocation,
            "status": item.status,
            "additionalNotes": item.additionalNotes,
            "lastUpdated": item.lastUpdated
        };
        itemsJson.push(itemJson);
    }
    
    return {
        "status": "success",
        "message": "Found items by finder retrieved successfully",
        "items": itemsJson,
        "totalItems": foundItems.length(),
        "finderEmail": finderEmail
    };
}

// Function to update found item status
public function updateFoundItemStatus(mongodb:Database db, string itemId, string newStatus) returns json|error {
    mongodb:Collection foundItemsCollection = check db->getCollection("founditems");
    
    // Valid status values for found items
    string[] validStatuses = ["found", "claimed", "returned"];
    boolean isValidStatus = false;
    foreach string status in validStatuses {
        if status == newStatus {
            isValidStatus = true;
            break;
        }
    }
    
    if !isValidStatus {
        return {
            "status": "error",
            "message": "Invalid status. Valid statuses are: " + validStatuses.toString()
        };
    }
    
    map<json> filter = {"itemId": itemId};
    map<json> updateDoc = {
        "status": newStatus,
        "lastUpdated": time:utcNow()[0].toString()
    };
    
    mongodb:UpdateResult updateResult = check foundItemsCollection->updateOne(filter, {"$set": updateDoc});
    
    if updateResult.modifiedCount == 0 {
        return {
            "status": "error",
            "message": "Found item not found or status not updated"
        };
    }
    
    io:println("📝 Found item status updated: " + itemId + " -> " + newStatus);
    
    return {
        "status": "success",
        "message": "Found item status updated successfully",
        "itemId": itemId,
        "newStatus": newStatus,
        "updatedAt": time:utcNow()[0].toString()
    };
}