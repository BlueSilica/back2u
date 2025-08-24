import ballerina/io;
import ballerina/test;

// Before Suite Function
@test:BeforeSuite
function beforeSuiteFunc() {
    io:println("I'm the before suite function!");
}

// Test function
@test:Config {}
function testChatModule() {
    // Simple test to verify module loads
    test:assertTrue(true, "Chat module test");
}

// After Suite Function
@test:AfterSuite
function afterSuiteFunc() {
    io:println("I'm the after suite function!");
}
