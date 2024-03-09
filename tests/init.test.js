import { before, after } from 'mocha';
import dbClient from '../utils/db';
import redisClient from '../utils/redisClient';

before(async () => {
  // Setup testing environment
  // Connect to test database
  await dbClient.connect();

  // Connect to test Redis server
  await redisClient.connect();
});

after(async () => {
  // Teardown testing environment
  // Disconnect from test database
  await dbClient.disconnect();

  // Disconnect from test Redis server
  await redisClient.disconnect();
});
