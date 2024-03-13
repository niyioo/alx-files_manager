import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import path from 'path';
import mime from 'mime-types';

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
    
          // Construct the response object with only the desired fields
          const responseFile = {
            id: newFile._id,
            userId: newFile.userId,
            name: newFile.name,
            type: newFile.type,
            isPublic: newFile.isPublic,
            parentId: newFile.parentId,
          };
    
          return response.status(201).json(responseFile);
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

  static async getData(request, response) {
    const { 'x-token': token } = request.headers;
    const { id } = request.params;
    const { size } = request.query;

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

    // Determine the local file path based on the specified size
    let filePath;
    switch (size) {
      case '500':
        filePath = file.localPath;
        break;
      case '250':
        filePath = file.localPath.replace(path.extname(file.localPath), `_250${path.extname(file.localPath)}`);
        break;
      case '100':
        filePath = file.localPath.replace(path.extname(file.localPath), `_100${path.extname(file.localPath)}`);
        break;
      default:
        return response.status(400).json({ error: 'Invalid size parameter' });
    }

    // Check if the local file exists
    if (!fs.existsSync(filePath)) {
      return response.status(404).json({ error: 'Not found' });
    }

    // Return the local file
    return response.sendFile(filePath);
  }

  static async putPublish(request, response) {
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

    // Check if the file belongs to the user
    if (file.userId !== user._id.toString()) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    // Update the file's isPublic to true
    try {
      await dbClient.updateFileIsPublic(id, true);
      const updatedFile = await dbClient.getFileById(id);
      return response.status(200).json(updatedFile);
    } catch (error) {
      console.error('Error updating file:', error);
      return response.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putUnpublish(request, response) {
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

    // Check if the file belongs to the user
    if (file.userId !== user._id.toString()) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    // Update the file's isPublic to false
    try {
      await dbClient.updateFileIsPublic(id, false);
      const updatedFile = await dbClient.getFileById(id);
      return response.status(200).json(updatedFile);
    } catch (error) {
      console.error('Error updating file:', error);
      return response.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getFile(request, response) {
    const { 'x-token': token } = request.headers;
    const { id } = request.params;

    // Retrieve the file document based on the ID
    const file = await dbClient.getFileById(id);
    if (!file) {
      return response.status(404).json({ error: 'Not found' });
    }

    // Check if the file is public or if the user is authenticated and owns the file
    const user = await dbClient.getUserByToken(token);
    if (!file.isPublic && (!user || file.userId !== user._id.toString())) {
      return response.status(404).json({ error: 'Not found' });
    }

    // Check if the file is a folder
    if (file.type === 'folder') {
      return response.status(400).json({ error: "A folder doesn't have content" });
    }

    // Check if the file exists locally
    if (!fs.existsSync(file.localPath)) {
      return response.status(404).json({ error: 'Not found' });
    }

    // Read the file content
    const fileContent = fs.readFileSync(file.localPath);

    // Get the MIME-type based on the file name
    const mimeType = mime.lookup(file.name);

    // Set the appropriate Content-Type header
    response.setHeader('Content-Type', mimeType);

    // Return the file content
    return response.send(fileContent);
  }
}
