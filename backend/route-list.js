// listRoutes.js
import expressListEndpoints from 'express-list-endpoints'; // Import express-list-endpoints
import app from './server.js'; // Import your Express app

// List all the routes
console.table(expressListEndpoints(app));
