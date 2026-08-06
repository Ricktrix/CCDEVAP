const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

afterAll(async () => {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('Testing database disconnected.');
        }
        if (mongoServer instanceof MongoMemoryServer) {
            await mongoServer.stop();
            console.log('MongoMemoryServer stopped.');
        }
        console.log('Testing environment cleaned successfully.');
    } catch (error) {
        console.error('Teardown failed.', error);
    }
});