'use strict';

const request = require('supertest');

// Must be mocked before requiring app — winston uses ESM deps that Jest can't transpile
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// ── Mock all DB models before requiring app ───────────────────────────────
jest.mock('../../models/User');
jest.mock('../../models/TokenBlacklist', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../models/RefreshToken', () => {
  const crypto = require('crypto');
  const mock = {
    hash: (token) => crypto.createHash('sha256').update(token).digest('hex'),
    create: jest.fn().mockResolvedValue({}),
    findOne: jest.fn(),
    findOneAndDelete: jest.fn(),
  };
  return mock;
});
jest.mock('../../models/ActivityLog', () => ({
  create: jest.fn().mockResolvedValue({}),
}));

const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');

const app = require('../../index');

// ── Helpers ───────────────────────────────────────────────────────────────
const validRegisterBody = {
  email: 'test@example.com',
  password: 'Password1!',
  username: 'testuser',
};

describe('POST /api/auth/register', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 201 and tokens on successful registration', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'user-id-1',
      email: validRegisterBody.email,
      username: validRegisterBody.username,
      role: 'user',
    });

    const res = await request(app).post('/api/auth/register').send(validRegisterBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('returns 409 when email is already registered', async () => {
    User.findOne.mockResolvedValue({ email: validRegisterBody.email });

    const res = await request(app).post('/api/auth/register').send(validRegisterBody);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegisterBody, email: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegisterBody, password: '123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 200 and tokens on valid credentials', async () => {
    const hashed = await bcrypt.hash('Password1!', 12);
    const mockUser = {
      _id: 'user-id-1',
      email: 'test@example.com',
      username: 'testuser',
      role: 'user',
      password: hashed,
      accountStatus: 'active',
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password1!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('returns 401 for wrong password', async () => {
    const hashed = await bcrypt.hash('CorrectPass1!', 12);
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'user-id-1',
        email: 'test@example.com',
        password: hashed,
        accountStatus: 'active',
      }),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPass1!' });

    expect(res.status).toBe(401);
  });

  it('returns 401 for non-existent email', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password1!' });

    expect(res.status).toBe(401);
  });

  it('returns 403 for suspended account', async () => {
    const hashed = await bcrypt.hash('Password1!', 12);
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'user-id-1',
        email: 'test@example.com',
        password: hashed,
        accountStatus: 'suspended',
      }),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password1!' });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/auth/logout', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 401 without Authorization header', async () => {
    const res = await request(app).post('/api/auth/logout').send({});
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer invalidtoken')
      .send({});
    expect(res.status).toBe(401);
  });
});

describe('GET /health', () => {
  it('returns health check response', async () => {
    const res = await request(app).get('/health');
    // 200 when DB connected, 503 when DB unavailable (test env has no DB)
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
  });
});
