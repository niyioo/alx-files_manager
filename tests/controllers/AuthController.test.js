// AuthController.test.js
import { describe, it } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';

describe('AuthController', () => {
  describe('GET /connect', () => {
    it('should return status 200 and a token if credentials are valid', async () => {
      const response = await request(app)
        .get('/connect')
        .set('Authorization', 'Basic base64encodedcredentials'); // Replace base64encodedcredentials with actual base64 encoded credentials
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('token');
    });

    it('should return status 401 if credentials are missing', async () => {
      const response = await request(app).get('/connect');
      expect(response.status).to.equal(401);
    });

    it('should return status 401 if credentials are invalid', async () => {
      const response = await request(app)
        .get('/connect')
        .set('Authorization', 'Basic invalidbase64encodedcredentials');
      expect(response.status).to.equal(401);
    });
  });

  describe('GET /disconnect', () => {
    it('should return status 204 if token is valid', async () => {
      // Add test implementation here
      // Assuming you have a valid token in token variable
      const response = await request(app)
        .get('/disconnect')
        .set('x-token', token);
      expect(response.status).to.equal(204);
    });

    it('should return status 401 if token is missing', async () => {
      const response = await request(app).get('/disconnect');
      expect(response.status).to.equal(401);
    });

    it('should return status 401 if token is invalid', async () => {
      const response = await request(app)
        .get('/disconnect')
        .set('x-token', 'invalidtoken');
      expect(response.status).to.equal(401);
    });
  });
});
