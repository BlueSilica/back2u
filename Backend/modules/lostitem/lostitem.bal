import ballerina/io;
import ballerina/time;
import ballerina/uuid;
import ballerinax/mongodb;

// Lost Item Data Structure
public type LostItemDb record {|
    string itemId;
    string reporterEmail;
    string reporterName;
    string reporterPhone;
    string itemName;
    string itemDescription;
    string category; // electronics, clothing, accessories, documents, etc.
    string itemBrand?; // optional brand
    string itemModel?; // optional model
    string[] itemImages?; // optional array of image URLs
    string lostDate; // when the item was lost
    string reportDate; // when it was reported
    LocationInfo lostLocation;
    string status; // "lost", "found", "claimed", "closed"
    string additionalNotes?;
    ContactPreferences contactPrefs;
    string lastUpdated;
|};

// Location Information
public type LocationInfo record {|
    string address;
    string city;
    string state;
    string country;
    decimal latitude;
    decimal longitude;
    string landmark?; // nearby landmark
    string locationDescription?; // additional description
|};

// Contact Preferences
public type ContactPreferences record {|
    boolean allowEmail;
    boolean allowPhone;
    boolean allowChat;
    string preferredContactTime?; // "morning", "afternoon", "evening", "anytime"
|};

// Request types for API
public type ReportLostItemRequest record {|
    string reporterEmail;
    string reporterName;
    string reporterPhone;
    string itemName;
    string itemDescription;
    string category;
    string itemBrand?;
    string itemModel?;
    string[] itemImages?;
    string lostDate;
    LocationInfo lostLocation;
    string additionalNotes?;
    ContactPreferences contactPrefs;
|};

public type SearchLostItemsRequest record {|
    string? category;
    string? city;
    string? state;
    decimal? latitude;
    decimal? longitude;
    decimal? radiusKm; // search radius in kilometers
    string? keyword; // search in item name and description
    string? dateFrom;
    string? dateTo;
    string? reporterEmail; // search by reporter email
    int? 'limit;
    int? offset;
|};

// Global lost items storage (in-memory for quick access)
LostItemDb[] lostItems = [];

// Report a lost item
public function reportLostItem(mongodb:Database db, ReportLostItemRequest request) returns json|error {
    mongodb:Collection lostItemsCollection = check db->getCollection("lostitems");
    
    string itemId = uuid:createType1AsString();
    string currentTimestamp = time:utcNow()[0].toString();
    
    LostItemDb lostItem = {
        itemId: itemId,
        reporterEmail: request.reporterEmail,
        reporterName: request.reporterName,
        reporterPhone: request.reporterPhone,
        itemName: request.itemName,
        itemDescription: request.itemDescription,
        category: request.category,
        itemBrand: request.itemBrand,
        itemModel: request.itemModel,
        itemImages: request.itemImages,
        lostDate: request.lostDate,
        reportDate: currentTimestamp,
        lostLocation: request.lostLocation,
        status: "lost",
        additionalNotes: request.additionalNotes,
        contactPrefs: request.contactPrefs,
        lastUpdated: currentTimestamp
    };
    
    // Insert into database
    check lostItemsCollection->insertOne(lostItem);
    
    // Add to in-memory storage for quick access
    lostItems.push(lostItem);
    
    io:println("📋 Lost item reported: " + itemId + " - " + request.itemName + " by " + request.reporterEmail);
    
    return {
        "status": "success",
        "message": "Lost item reported successfully",
        "itemId": itemId,
        "reportDate": currentTimestamp,
        "item": {
            "itemId": itemId,
            "itemName": request.itemName,
            "category": request.category,
            "lostLocation": {
                "address": request.lostLocation.address,
                "city": request.lostLocation.city,
                "latitude": request.lostLocation.latitude,
                "longitude": request.lostLocation.longitude
            },
            "status": "lost"
        }
    };
}

// Get all lost items with optional filtering
public function getLostItems(mongodb:Database db, SearchLostItemsRequest? searchParams) returns json|error {
    mongodb:Collection lostItemsCollection = check db->getCollection("lostitems");
    
    // Build filter based on search parameters
    map<json> filter = {};
    
    if searchParams is SearchLostItemsRequest {
        // Filter by category
        if searchParams.category is string {
            filter["category"] = searchParams.category;
        }
        
        // Filter by city
        if searchParams.city is string {
            filter["lostLocation.city"] = searchParams.city;
        }
        
        // Filter by state
        if searchParams.state is string {
            filter["lostLocation.state"] = searchParams.state;
        }
        
        // Filter by reporter email
        if searchParams.reporterEmail is string {
            filter["reporterEmail"] = searchParams.reporterEmail;
        }
        
        // Filter by date range
        if searchParams.dateFrom is string || searchParams.dateTo is string {
            map<json> dateFilter = {};
            if searchParams.dateFrom is string {
                dateFilter["$gte"] = searchParams.dateFrom;
            }
            if searchParams.dateTo is string {
                dateFilter["$lte"] = searchParams.dateTo;
            }
            filter["lostDate"] = dateFilter;
        }
        
        // Keyword search in item name and description
        if searchParams.keyword is string {
            filter["$or"] = [
                {"itemName": {"$regex": searchParams.keyword, "$options": "i"}},
                {"itemDescription": {"$regex": searchParams.keyword, "$options": "i"}}
            ];
        }
    }
    
    // Only show active lost items
    filter["status"] = "lost";
    
    stream<LostItemDb, error?> findResult = check lostItemsCollection->find(filter);
    LostItemDb[] items = check from LostItemDb item in findResult select item;
    
    // Convert to JSON format for API response
    json[] itemsJson = [];
    foreach LostItemDb item in items {
        json itemJson = {
            "itemId": item.itemId,
            "itemName": item.itemName,
            "itemDescription": item.itemDescription,
            "category": item.category,
            "itemBrand": item.itemBrand,
            "itemModel": item.itemModel,
            "itemImages": item.itemImages,
            "lostDate": item.lostDate,
            "reportDate": item.reportDate,
            "lostLocation": {
                "address": item.lostLocation.address,
                "city": item.lostLocation.city,
                "state": item.lostLocation.state,
                "country": item.lostLocation.country,
                "latitude": item.lostLocation.latitude,
                "longitude": item.lostLocation.longitude,
                "landmark": item.lostLocation.landmark,
                "locationDescription": item.lostLocation.locationDescription
            },
            "status": item.status,
            "reporterName": item.reporterName,
            "contactPrefs": item.contactPrefs,
            "additionalNotes": item.additionalNotes,
            "lastUpdated": item.lastUpdated
        };
        itemsJson.push(itemJson);
    }
    
    io:println("🔍 Retrieved " + items.length().toString() + " lost items");
    
    return {
        "status": "success",
        "message": "Lost items retrieved successfully",
        "items": itemsJson,
        "totalItems": items.length()
    };
}

// Get lost item by ID
public function getLostItemById(mongodb:Database db, string itemId) returns json|error {
    mongodb:Collection lostItemsCollection = check db->getCollection("lostitems");
    
    map<json> filter = {"itemId": itemId};
    stream<LostItemDb, error?> findResult = check lostItemsCollection->find(filter);
    LostItemDb[] items = check from LostItemDb item in findResult select item;
    
    if items.length() == 0 {
        return {
            "status": "error",
            "message": "Lost item not found"
        };
    }
    
    LostItemDb item = items[0];
    
    return {
        "status": "success",
        "message": "Lost item retrieved successfully",
        "item": {
            "itemId": item.itemId,
            "reporterEmail": item.reporterEmail,
            "reporterName": item.reporterName,
            "reporterPhone": item.reporterPhone,
            "itemName": item.itemName,
            "itemDescription": item.itemDescription,
            "category": item.category,
            "itemBrand": item.itemBrand,
            "itemModel": item.itemModel,
            "itemImages": item.itemImages,
            "lostDate": item.lostDate,
            "reportDate": item.reportDate,
            "lostLocation": item.lostLocation,
            "status": item.status,
            "additionalNotes": item.additionalNotes,
            "contactPrefs": item.contactPrefs,
            "lastUpdated": item.lastUpdated
        }
    };
}

// Search lost items by location (within radius)
public function searchLostItemsByLocation(mongodb:Database db, decimal latitude, decimal longitude, decimal radiusKm) returns json|error {
    mongodb:Collection lostItemsCollection = check db->getCollection("lostitems");
    
    // Simple bounding box search (rough approximation)
    decimal latDelta = radiusKm / 111.0d; // 1 degree ≈ 111 km
    decimal lonDelta = radiusKm / 111.0d; // Simplified longitude calculation
    
    map<json> filter = {
        "lostLocation.latitude": {
            "$gte": latitude - latDelta,
            "$lte": latitude + latDelta
        },
        "lostLocation.longitude": {
            "$gte": longitude - lonDelta,
            "$lte": longitude + lonDelta
        },
        "status": "lost"
    };
    
    stream<LostItemDb, error?> findResult = check lostItemsCollection->find(filter);
    LostItemDb[] items = check from LostItemDb item in findResult select item;
    
    // Convert to JSON and calculate rough distances
    json[] itemsJson = [];
    foreach LostItemDb item in items {
        // Simple distance calculation (not accurate but workable)
        decimal latDiff = decimal:abs(item.lostLocation.latitude - latitude);
        decimal lonDiff = decimal:abs(item.lostLocation.longitude - longitude);
        decimal distance = (latDiff + lonDiff) * 111.0d; // Very rough distance approximation
        
        if distance <= radiusKm {
            json itemJson = {
                "itemId": item.itemId,
                "itemName": item.itemName,
                "itemDescription": item.itemDescription,
                "category": item.category,
                "lostDate": item.lostDate,
                "lostLocation": item.lostLocation,
                "distance": distance,
                "reporterName": item.reporterName,
                "contactPrefs": item.contactPrefs
            };
            itemsJson.push(itemJson);
        }
    }
    
    return {
        "status": "success",
        "message": "Lost items near location retrieved successfully",
        "items": itemsJson,
        "totalItems": itemsJson.length(),
        "searchLocation": {
            "latitude": latitude,
            "longitude": longitude,
            "radiusKm": radiusKm
        }
    };
}

// Update lost item status
public function updateLostItemStatus(mongodb:Database db, string itemId, string newStatus) returns json|error {
    mongodb:Collection lostItemsCollection = check db->getCollection("lostitems");
    
    string currentTimestamp = time:utcNow()[0].toString();
    
    map<json> filter = {"itemId": itemId};
    
    // Create proper update document
    map<json> updateDoc = {
        "status": newStatus,
        "lastUpdated": currentTimestamp
    };
    
    mongodb:UpdateResult updateResult = check lostItemsCollection->updateOne(filter, {"$set": updateDoc});
    
    if updateResult.modifiedCount == 0 {
        return {
            "status": "error",
            "message": "Lost item not found or no changes made"
        };
    }
    
    io:println("📝 Lost item status updated: " + itemId + " -> " + newStatus);
    
    return {
        "status": "success",
        "message": "Lost item status updated successfully",
        "itemId": itemId,
        "newStatus": newStatus,
        "lastUpdated": currentTimestamp
    };
}

// Get lost items by reporter email
public function getLostItemsByReporter(mongodb:Database db, string reporterEmail) returns json|error {
    mongodb:Collection lostItemsCollection = check db->getCollection("lostitems");
    
    map<json> filter = {"reporterEmail": reporterEmail};
    stream<LostItemDb, error?> findResult = check lostItemsCollection->find(filter);
    LostItemDb[] items = check from LostItemDb item in findResult select item;
    
    json[] itemsJson = [];
    foreach LostItemDb item in items {
        json itemJson = {
            "itemId": item.itemId,
            "itemName": item.itemName,
            "itemDescription": item.itemDescription,
            "category": item.category,
            "lostDate": item.lostDate,
            "reportDate": item.reportDate,
            "lostLocation": item.lostLocation,
            "status": item.status,
            "lastUpdated": item.lastUpdated
        };
        itemsJson.push(itemJson);
    }
    
    return {
        "status": "success",
        "message": "Reporter's lost items retrieved successfully",
        "items": itemsJson,
        "totalItems": items.length()
    };
}
