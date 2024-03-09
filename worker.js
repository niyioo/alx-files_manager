import Queue from 'bull';
import dbClient from './utils/db';

// Create Bull queue for file processing
export const fileQueue = new Queue('fileQueue');

// Create Bull queue for user welcome email
export const userQueue = new Queue('userQueue');

// Process the file processing queue
fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }
  if (!fileId) {
    throw new Error('Missing fileId');
  }

  const file = await dbClient.getFileById(fileId, userId);
  if (!file) {
    throw new Error('File not found');
  }

  // Generate thumbnails
  await generateThumbnail(fileId);
});

// Process the user welcome email queue
userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  // Retrieve the user
  const user = await dbClient.getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Send the welcome email
  console.log(`Welcome ${user.email}!`);
});
