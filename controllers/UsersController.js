import { createHash } from 'crypto';
import dbClient from '../utils/db';
import { userQueue } from '../worker';

export default class UsersController {
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
      const existingUser = await dbClient.getUserByEmail(email);
      if (existingUser) {
        return response.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA1
      const hashedPassword = createHash('sha1').update(password).digest('hex');

      // Create a new user in the database
      const newUser = await dbClient.createUser(email, hashedPassword);

      // Enqueue job to send welcome email
      await userQueue.add({ userId: newUser._id });

      // Return the new user with only the email and id
      return response.status(201).json({ id: newUser._id, email: newUser.email });
    } catch (error) {
      // Handle any errors
      return response.status(500).json({ error: error.message });
    }
  }

  static async getMe(request, response) {
    const token = request.headers['x-token'];

    if (!token) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Retrieve the user based on the token
      const user = await dbClient.getUserByToken(token);

      if (!user) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      // Return the user object (email and id only)
      return response.status(200).json({ id: user._id, email: user.email });
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }
}
