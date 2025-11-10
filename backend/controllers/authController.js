const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');
const RefreshToken = require('../models/RefreshToken');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Access token: short-lived (15 min)
const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

// Refresh token: long-lived (30 days), stored in DB as a hash
const generateRefreshToken = async (userId, ip) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await RefreshToken.create({
    userId,
    tokenHash: RefreshToken.hash(token),
    expiresAt,
    createdByIp: ip
  });

  return token;
};

const sendTokens = async (res, user, ip, statusCode = 200) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user._id, ip);

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
    data: { id: user._id, email: user.email, username: user.username, role: user.role }
  });
};

exports.register = async (req, res) => {
  try {
    const { email, password, username, walletAddress } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      password: hashedPassword,
      username: username || `User_${Date.now()}`,
      walletAddress: walletAddress || undefined,
      accountStatus: 'active'
    });

    await sendTokens(res, user, req.ip, 201);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({ success: false, error: `Account is ${user.accountStatus}.` });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    res.locals.message = 'Login successful.';
    await sendTokens(res, user, req.ip);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token is required.' });
    }

    const tokenHash = RefreshToken.hash(refreshToken);
    const stored = await RefreshToken.findOne({ tokenHash });

    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token.' });
    }

    const user = await User.findById(stored.userId);
    if (!user || user.accountStatus !== 'active') {
      return res.status(401).json({ success: false, error: 'User not found or account inactive.' });
    }

    // Rotate: delete old refresh token, issue new pair
    await RefreshToken.deleteOne({ tokenHash });
    await sendTokens(res, user, req.ip);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Revoke refresh token if provided
    if (refreshToken) {
      await RefreshToken.deleteOne({ tokenHash: RefreshToken.hash(refreshToken) });
    }

    // Blacklist the access token for its remaining lifetime
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded?.exp) {
        await TokenBlacklist.create({ token, expiresAt: new Date(decoded.exp * 1000) });
      }
    }

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    res.json({ success: true, message: 'Logged out successfully.' });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ success: false, error: 'Google OAuth is not configured.' });
    }

    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const { email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email, username: name || `User_${Date.now()}`, picture,
        isVerified: true, verificationLevel: 'email', accountStatus: 'active'
      });
    } else if (user.accountStatus !== 'active') {
      return res.status(403).json({ success: false, error: `Account is ${user.accountStatus}.` });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    await sendTokens(res, user, req.ip);
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid Google token.' });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};


const SETTING_5 = true;
