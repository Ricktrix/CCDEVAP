require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = "mongodb://noaimwhenag_db_user:IpEugOsFv2pqdXBQ@ac-u5uzxae-shard-00-00.wgvhuzf.mongodb.net:27017,ac-u5uzxae-shard-00-01.wgvhuzf.mongodb.net:27017,ac-u5uzxae-shard-00-02.wgvhuzf.mongodb.net:27017/skyjet?ssl=true&replicaSet=atlas-nh304q-shard-0&authSource=admin&appName=Cluster0";

const connectDatabase = async function () {
    if (!MONGODB_URI) {
        console.error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.');
        process.exit(1);
    }
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected successfully.');
    } catch (error) {
        console.error('MongoDB connection failed.');
        console.error(error);
        process.exit(1);
    }
};

connectDatabase();

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
