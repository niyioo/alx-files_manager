import sha1 from 'sha1'; // for hashing passwords
import dbClient from '../utils/db';

const UsersController = {
  async postNew(req, res) {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Check if email already exists in DB
    const existingUser = await dbClient.db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // Hash the password
    const hashedPassword = sha1(password);

    // Create new user object
    const newUser = {
      email,
      password: hashedPassword,
    };

    try {
      // Insert new user into the database
      const result = await dbClient.db.collection('users').insertOne(newUser);
      const { insertedId } = result;

      // Return the new user with only email and id
      return res.status(201).json({ id: insertedId, email });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

export default UsersController;
