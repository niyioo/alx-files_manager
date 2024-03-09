import { createHash } from 'crypto';
import dbClient from '../utils/db';

export default class UsersController {
  static async getUserByEmail(email) {
    try {
      const usersCollection = dbClient.client.db().collection('users');
      return await usersCollection.findOne({ email });
    } catch (error) {
      console.error('Error retrieving user by email:', error);
      throw error;
    }
  }

  static async createUser(email, password) {
    try {
      const hashedPassword = createHash('sha1').update(password).digest('hex');
      const usersCollection = dbClient.client.db().collection('users');
      const result = await usersCollection.insertOne({ email, password: hashedPassword });
      return result.ops[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async postNew(request, response) {
    const { email, password } = request.body;

    // Check if email and password are provided
    if (!email) {
      return response.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return response.status(400).json({ error: 'Missing password' });
    }

    try {
      // Check if the email already exists in the database
      const existingUser = await UsersController.getUserByEmail(email);
      if (existingUser && existingUser.email) {
        return response.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA1
      const hashedPassword = createHash('sha1').update(password).digest('hex');

      // Create a new user in the database
      const newUser = await UsersController.createUser(email, hashedPassword);

      // Return the new user with only the email and id
      return response.status(201).json({ id: newUser._id, email: newUser.email });
    } catch (error) {
      // Handle any errors
      return response.status(500).json({ error: error.message });
    }
  }
}
