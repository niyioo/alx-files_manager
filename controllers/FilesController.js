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
      if (!fs.existsSync(storingFolder)) {
        fs.mkdirSync(storingFolder, { recursive: true }); // Create directory if it doesn't exist
      }
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

  static async getShow(request, response) {
    const { 'x-token': token } = request.headers;
    const { id } = request.params;

    // Retrieve the user based on the token
    const user = await dbClient.getUserByToken(token);
    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve the file document based on the ID
    const file = await dbClient.getFileById(id);
    if (!file) {
      return response.status(404).json({ error: 'Not found' });
    }

    return response.status(200).json(file);
  }

  static async getIndex(request, response) {
    const { 'x-token': token } = request.headers;
    const { parentId = '0', page = 0 } = request.query;

    // Retrieve the user based on the token
    const user = await dbClient.getUserByToken(token);
    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve files based on parentId and pagination
    const pageSize = 20;
    const skip = parseInt(page, 10) * pageSize;

    const files = await dbClient.getFilesByParentId(parentId, skip, pageSize);
    return response.status(200).json(files);
  }
}
