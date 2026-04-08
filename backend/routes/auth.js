const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/security');
const { validateRegister, validateLogin, validateRefresh, validateGoogleAuth } = require('../middleware/validation');

// POST /api/auth/register
router.post('/register', strictLimiter, validateRegister, authController.register);

// POST /api/auth/login
router.post('/login', strictLimiter, validateLogin, authController.login);

// POST /api/auth/refresh — exchange refresh token for new access token (no authenticate needed)
router.post('/refresh', validateRefresh, authController.refresh);

// POST /api/auth/logout (requires valid access token)
router.post('/logout', authenticate, authController.logout);

// POST /api/auth/google
router.post('/google', strictLimiter, validateGoogleAuth, authController.googleLogin);

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

module.exports = router;
