import express from 'express';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Load all routes from routes/index.js
app.use('/', routes);

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});