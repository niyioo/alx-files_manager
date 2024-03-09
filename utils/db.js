import { MongoClient } from 'mongodb';

class DBClient {
    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || 'files_manager';
        const url = `mongodb://${host}:${port}/${database}`;

        this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
        this.client.connect((err) => {
            if (err) {
                console.error('MongoDB connection error:', err);
            } else {
                console.log('Connected to MongoDB');
            }
        });
    }

    isAlive() {
        // Check if the connection to MongoDB is successful
        return !!this.client && this.client.isConnected();
    }

    async nbUsers() {
        // Return the number of documents in the 'users' collection
        const usersCollection = this.client.db().collection('users');
        return usersCollection.countDocuments();
    }

    async nbFiles() {
        // Return the number of documents in the 'files' collection
        const filesCollection = this.client.db().collection('files');
        return filesCollection.countDocuments();
    }
}

// Create and export an instance of DBClient
const dbClient = new DBClient();
export default dbClient;
