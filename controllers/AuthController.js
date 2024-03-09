import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';

export default class AuthController {
  static async getConnect(request, response) {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const encodedCredentials = authHeader.split(' ')[1];
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString();
    const [email, password] = decodedCredentials.split(':');

    if (!email || !password) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const hashedPassword = createHash('sha1').update(password).digest('hex');
      const user = await dbClient.getUserByEmail(email);

      if (!user || user.password !== hashedPassword) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();

      // Store the token in the database
      await dbClient.createUserToken(user._id, token);

      return response.status(200).json({ token });
    } catch (error) {
      console.error('Error signing in:', error);
      return response.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getDisconnect(request, response) {
    const { 'x-token': token } = request.headers;

    if (!token) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Retrieve the user ID associated with the token
      const userId = await dbClient.getUserByToken(token);

      if (!userId) {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      // Delete the token from the database
      await dbClient.deleteUserToken(userId);

      return response.status(204).send();
    } catch (error) {
      console.error('Error signing out:', error);
      return response.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
