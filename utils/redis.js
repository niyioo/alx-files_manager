import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', (error) => console.log(error));
  }

  isAlive() {
    // Check if the connection to Redis is successful
    return this.client.connected;
  }

  async get(key) {
    // Retrieve the value stored for the given key from Redis
    const getAsync = promisify(this.client.GET).bind(this.client);
    return getAsync(key);
  }

  async set(key, value, duration) {
    // Convert duration to seconds if provided in milliseconds
    const seconds = Math.ceil(duration / 1000);

    console.log('Expiration duration in seconds:', seconds);

    // Check if the duration is a valid integer
    if (!Number.isInteger(seconds) || seconds <= 0) {
      throw new Error('Invalid expiration duration');
    }

    // Store the value in Redis with an expiration set by the duration argument
    const setAsync = promisify(this.client.SET).bind(this.client);
    return setAsync(key, value, 'EX', seconds);
  }

  async del(key) {
    // Remove the value in Redis for the given key
    const delAsync = promisify(this.client.DEL).bind(this.client);
    return delAsync(key);
  }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
