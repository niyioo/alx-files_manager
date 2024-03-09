import { MongoClient, ObjectId } from 'mongodb';

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
    const usersCollection = this.client.db().collection('users');
    return usersCollection.countDocuments();
  }

  async nbFiles() {
    const filesCollection = this.client.db().collection('files');
    return filesCollection.countDocuments();
  }

  async getUserByEmail(email) {
    const usersCollection = this.client.db().collection('users');
    return usersCollection.findOne({ email });
  }

  async getUserByToken(token) {
    const usersCollection = this.client.db().collection('users');
    return usersCollection.findOne({ token });
  }

  async createUser(email, hashedPassword) {
    try {
      const usersCollection = this.client.db().collection('users');
      const result = await usersCollection.insertOne({ email, password: hashedPassword });
      return result.ops[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async createUserToken(userId, token) {
    try {
      const usersCollection = this.client.db().collection('users');
      await usersCollection.updateOne({ _id: userId }, { $set: { token } });
    } catch (error) {
      console.error('Error creating user token:', error);
      throw error;
    }
  }

  async deleteUserToken(userId) {
    try {
      const usersCollection = this.client.db().collection('users');
      await usersCollection.updateOne({ _id: userId }, { $unset: { token: '' } });
    } catch (error) {
      console.error('Error deleting user token:', error);
      throw error;
    }
  }

  async getFileById(fileId) {
    try {
      const filesCollection = this.client.db().collection('files');
      return await filesCollection.findOne({ _id: ObjectId(fileId) });
    } catch (error) {
      console.error('Error getting file by ID:', error);
      throw error;
    }
  }

  async createFile(userId, name, type, parentId = 0, isPublic = false, localPath = '') {
    try {
      const filesCollection = this.client.db().collection('files');
      const result = await filesCollection.insertOne({
        userId: ObjectId(userId),
        name,
        type,
        parentId: parentId === 0 ? parentId : ObjectId(parentId),
        isPublic,
        localPath,
      });
      return result.ops[0];
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  }
}

// Create and export an instance of DBClient
const dbClient = new DBClient();
export default dbClient;
