import ballerina/websocket;
import ballerina/io;

// Store connected WebSocket clients
websocket:Caller[] clients = [];

// Add client to the list
public function addClient(websocket:Caller caller) {
    clients.push(caller);
    io:println("👤 New chat client connected");
}

// Remove client from the list  
public function removeClient(websocket:Caller caller) {
    int i = 0;
    while (i < clients.length()) {
        if (clients[i] === caller) {
            _ = clients.remove(i);
            break;
        }
        i += 1;
    }
    io:println("❌ Client disconnected");
}

// Broadcast message to all clients except sender
public function broadcastMessage(websocket:Caller sender, string message) {
    foreach websocket:Caller wsClient in clients {
        if (wsClient !== sender) {
            var result = wsClient->writeTextMessage(message);
            if (result is error) {
                io:println("Error sending message: " + result.message());
            }
        }
    }
}

// Get number of connected clients
public function getClientCount() returns int {
    return clients.length();
}
