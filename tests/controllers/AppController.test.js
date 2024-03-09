// AppController.test.js
import { describe, it } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';

describe('AppController', () => {
  describe('GET /status', () => {
    it('should return status 200 and { redis: true, db: true }', async () => {
      const response = await request(app).get('/status');
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ redis: true, db: true });
    });
  });

  describe('GET /stats', () => {
    it('should return status 200 and { users: <number>, files: <number> }', async () => {
      const response = await request(app).get('/stats');
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('users');
      expect(response.body).to.have.property('files');
    });
  });
});
