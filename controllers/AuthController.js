import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import UtilController from './UtilController';
import dbClient from '../utils/db';

export default class AuthController {
  static async authenticate(request, response) {
    try {
      const encodedAuthPair = request.headers.authorization.split(' ')[1];
      const decodedAuthPair = Buffer.from(encodedAuthPair, 'base64').toString().split(':');
      const userEmail = decodedAuthPair[0];
      const hashedPassword = UtilController.generateSHA1Hash(decodedAuthPair[1]);
      const user = await dbClient.findUserByEmail(userEmail);
      if (!user || user.password !== hashedPassword) {
        response.status(401).json({ error: 'Unauthorized' }).end();
      } else {
        const authToken = uuidv4();
        await redisClient.set(`auth_${authToken}`, user._id.toString(), 86400);
        response.status(200).json({ token: authToken }).end();
      }
    } catch (error) {
      response.status(401).json({ error: 'Unauthorized' }).end();
    }
  }

  static async signOut(request, response) {
    const { authToken } = request;
    await redisClient.del(authToken);
    response.status(204).end();
  }
}
