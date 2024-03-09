/* eslint-disable no-param-reassign */
import { contentType } from 'mime-types';
import dbClient from '../utils/db';
import UtilController from './UtilController';

export default class FilesController {
  static async uploadFile(req, res) {
    const userId = req.user.id;
    const {
      name, type, parentId, isPublic, data,
    } = req.body;
    if (!name || !type || (!['folder', 'file', 'image'].includes(type)) || (!data && type !== 'folder')) {
      res.status(400).send(`error: ${!name ? 'Missing name' : (!type || (!['folder', 'file', 'image'].includes(type)))
        ? 'Missing type' : 'Missing data'}`);
    } else {
      try {
        let flag = false;
        if (parentId) {
          const parentFolder = await dbClient.findFile({ _id: parentId });
          if (!parentFolder) {
            res.status(400).json({ error: 'Parent not found' }).end();
            flag = true;
          } else if (parentFolder.type !== 'folder') {
            res.status(400).json({ error: 'Parent is not a folder' }).end();
            flag = true;
          }
        }
        if (!flag) {
          const insertResult = await dbClient.newFile(userId, name, type, isPublic, parentId, data);
          const file = insertResult.ops[0];
          delete file.localPath;
          file.id = file._id;
          delete file._id;
          res.status(201).json(file).end();
        }
      } catch (error) {
        res.status(400).json({ error: error.message }).end();
      }
    }
  }

  static async getFileDetails(req, res) {
    const userId = req.user._id;
    const { id } = req.params;
    const file = await dbClient.findFile({ _id: id });
    if (!file || String(file.userId) !== String(userId)) {
      res.status(404).json({ error: 'Not found' }).end();
    } else {
      res.status(200).json(file).end();
    }
  }

  static async getFileList(req, res) {
    const userId = req.user._id;
    const parentId = req.query.parentId || '0';
    const page = req.query.page || 0;
    const cursor = await dbClient.findFiles(
      { parentId, userId },
      { limit: 20, skip: 20 * page },
    );
    const fileList = await cursor.toArray();
    fileList.map((file) => {
      file.id = file._id;
      delete file._id;
      return file;
    });
    res.status(200).json(fileList).end();
  }

  static async publishFile(req, res) {
    const userId = req.user._id;
    const file = await dbClient.findFile({ _id: req.params.id });
    if (!file || String(file.userId) !== String(userId)) {
      res.status(404).json({ error: 'Not found' }).end();
    } else {
      const updatedFile = await dbClient.updateFile({ _id: file._id }, { isPublic: true });
      res.status(200).json(updatedFile).end();
    }
  }

  static async unpublishFile(req, res) {
    const userId = req.user._id;
    const file = await dbClient.findFile({ _id: req.params.id });
    if (!file || String(file.userId) !== String(userId)) {
      res.status(404).json({ error: 'Not found' }).end();
    } else {
      const updatedFile = await dbClient.updateFile({ _id: file._id }, { isPublic: false });
      res.status(200).json(updatedFile).end();
    }
  }

  static async downloadFile(req, res) {
    const userId = req.user._id;
    const file = await dbClient.findFile({ _id: req.params.id });
    if (!file) {
      res.status(404).json({ error: 'Not found' }).end();
    } else if (file.type === 'folder') {
      res.status(400).json({ error: "A folder doesn't have content" }).end();
    } else if (String(file.userId) === String(userId) || file.isPublic) {
      try {
        const content = await UtilController.readFileContent(file.localPath);
        const headers = { 'Content-Type': contentType(file.name) };
        res.set(headers).status(200).send(content).end();
      } catch (error) {
        res.status(404).json({ error: 'Not found' }).end();
      }
    } else {
      res.status(404).json({ error: 'Not found' }).end();
    }
  }
}
