import { describe, it } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';

describe('UsersController', () => {
  describe('POST /users', () => {
    it('should create a new user and return status 201', async () => {
      const response = await request(app)
        .post('/users')
        .send({ email: 'test@example.com', password: 'password123' });
      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('email', 'test@example.com');
    });

    it('should return status 400 if email is missing', async () => {
      const response = await request(app)
        .post('/users')
        .send({ password: 'password123' });
      expect(response.status).to.equal(400);
    });

    it('should return status 400 if password is missing', async () => {
      const response = await request(app)
        .post('/users')
        .send({ email: 'test@example.com' });
      expect(response.status).to.equal(400);
    });

    it('should return status 400 if email already exists', async () => {
      // Assuming test@example.com already exists in the database
      const response = await request(app)
        .post('/users')
        .send({ email: 'test@example.com', password: 'password123' });
      expect(response.status).to.equal(400);
    });
  });

  describe('GET /users/me', () => {
    it('should return current user details if token is valid', async () => {
      // Assuming you have a valid token in token variable
      const response = await request(app)
        .get('/users/me')
        .set('x-token', token);
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('email');
    });

    it('should return status 401 if token is missing', async () => {
      const response = await request(app).get('/users/me');
      expect(response.status).to.equal(401);
    });

    it('should return status 401 if token is invalid', async () => {
      const response = await request(app)
        .get('/users/me')
        .set('x-token', 'invalidtoken');
      expect(response.status).to.equal(401);
    });
  });
});
