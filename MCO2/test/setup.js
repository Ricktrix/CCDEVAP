const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';

let mongoServer;

beforeAll(async () => {
    try {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        console.log('Testing database connected.');
    } catch (error) {
        console.error('Setup failed.', error);
        throw error;
    }
});
beforeEach(async () => {
    try {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            if (Object.prototype.hasOwnProperty.call(collections, key)) {
                await collections[key].deleteMany({});
            }
        }
        console.log('Testing collections cleared.');
    } catch (error) {
        console.error('Failed to clear testing collections.', error);
        throw error;
    }
});

module.exports = { getMongoServer: () => mongoServer };