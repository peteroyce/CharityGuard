'use strict';

// Provide required env vars before any module loads
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-minimum-32-characters-long!!';
process.env.MONGODB_URI = 'mongodb://localhost:27017/charityguard-test';

