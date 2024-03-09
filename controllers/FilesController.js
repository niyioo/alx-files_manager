import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';

export default class FilesController {
  static async postUpload(request, response) {
    const { 'x-token': token } = request.headers;

    // Retrieve the user based on the token
    const user = await dbClient.getUserByToken(token);
    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, data, parentId = 0, isPublic = false,
    } = request.body;

    // Validation checks for missing fields
    if (!name) {
      return response.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return response.status(400).json({ error: 'Missing type or invalid type' });
    }
    if ((type !== 'folder' && !data) || (type === 'folder' && data)) {
      return response.status(400).json({ error: 'Missing data' });
    }

    // If parentId is set, validate it
    if (parentId !== 0) {
      const parentFile = await dbClient.getFileById(parentId);
      if (!parentFile) {
        return response.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return response.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    let localPath = '';
    if (type !== 'folder') {
      // Store the file locally
      const storingFolder = process.env.FOLDER_PATH || '/tmp/files_manager';
      localPath = path.join(storingFolder, `${uuidv4()}`);
      try {
        fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
      } catch (error) {
        console.error('Error saving file locally:', error);
        return response.status(500).json({ error: 'Internal Server Error' });
      }
    }

    // Create file document in the database
    try {
      const newFile = await dbClient.createFile(
        user._id, name, type, parentId, isPublic, localPath,
      );
      return response.status(201).json(newFile);
    } catch (error) {
      console.error('Error creating file:', error);
      return response.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
