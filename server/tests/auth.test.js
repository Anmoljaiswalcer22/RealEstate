jest.mock('../utils/firebaseAdmin', () => ({
  isConfigured: jest.fn(() => false),
  verifyIdToken: jest.fn(),
}));

const request = require('supertest');
const app = require('../app');
const db = require('./helpers/db');
const User = require('../models/user.model');
const firebaseAdmin = require('../utils/firebaseAdmin');

beforeAll(db.connect);
afterEach(async () => {
  await db.clear();
  firebaseAdmin.isConfigured.mockReturnValue(false);
  firebaseAdmin.verifyIdToken.mockReset();
});
afterAll(db.close);

const alice = { username: 'alice', email: 'alice@test.com', password: 'secret123' };
const getCookie = (res, name) => (res.headers['set-cookie'] || []).find((c) => c.startsWith(`${name}=`));

describe('POST /api/auth/signup', () => {
  it('creates a user and returns 201', async () => {
    const res = await request(app).post('/api/auth/signup').send(alice);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('stores a bcrypt hash, never the plain password', async () => {
    await request(app).post('/api/auth/signup').send(alice);
    const user = await User.findOne({ email: alice.email });
    expect(user.password).not.toBe(alice.password);
    expect(user.password).toMatch(/^\$2[aby]\$10\$/);
  });

  it('returns 409 for a duplicate email', async () => {
    await request(app).post('/api/auth/signup').send(alice);
    const res = await request(app).post('/api/auth/signup').send({ ...alice, username: 'alice2' });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/email already exists/i);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'x@test.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual(expect.objectContaining({ success: false, statusCode: 400 }));
  });

  it('returns 400 for a short password', async () => {
    const res = await request(app).post('/api/auth/signup').send({ ...alice, password: '123' });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/signin', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(alice);
  });

  it('rejects a wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/signin').send({ email: alice.email, password: 'wrong' });
    expect(res.statusCode).toBe(401);
  });

  it('sets httpOnly token cookies and never returns the password', async () => {
    const res = await request(app).post('/api/auth/signin').send({ email: alice.email, password: alice.password });
    expect(res.statusCode).toBe(200);
    expect(getCookie(res, 'access_token')).toMatch(/HttpOnly/);
    expect(getCookie(res, 'refresh_token')).toMatch(/HttpOnly/);
    expect(res.body.password).toBeUndefined();
    expect(res.body.refreshTokenHash).toBeUndefined();
    expect(res.body.email).toBe(alice.email);
  });

  it('blocks NoSQL injection in login fields', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.statusCode).toBe(400);
  });
});

describe('protected routes', () => {
  it('return 401 without a token', async () => {
    const res = await request(app).get('/api/booking/user');
    expect(res.statusCode).toBe(401);
  });

  it('return 401 with a tampered token', async () => {
    const res = await request(app).get('/api/booking/user').set('Authorization', 'Bearer abc.def.ghi');
    expect(res.statusCode).toBe(401);
  });
});

describe('refresh token rotation', () => {
  it('issues new tokens and rejects re-use of an old refresh token', async () => {
    await request(app).post('/api/auth/signup').send(alice);
    const signin = await request(app).post('/api/auth/signin').send({ email: alice.email, password: alice.password });
    const oldRefresh = getCookie(signin, 'refresh_token').split(';')[0];

    const first = await request(app).post('/api/auth/refresh').set('Cookie', oldRefresh);
    expect(first.statusCode).toBe(200);
    expect(getCookie(first, 'access_token')).toBeDefined();

    const reused = await request(app).post('/api/auth/refresh').set('Cookie', oldRefresh);
    expect(reused.statusCode).toBe(401);
  });

  it('signout revokes the refresh token', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/signup').send(alice);
    const signin = await agent.post('/api/auth/signin').send({ email: alice.email, password: alice.password });
    const refreshCookie = getCookie(signin, 'refresh_token').split(';')[0];

    await agent.get('/api/auth/signout').expect(200);
    const res = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/auth/google', () => {
  it('creates a new user with a random hashed password', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ name: 'Bob Singh', email: 'bob@gmail.com', photo: 'https://example.com/bob.png' });
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toMatch(/^bobsingh/);
    expect(res.body.avatar).toBe('https://example.com/bob.png');

    const user = await User.findOne({ email: 'bob@gmail.com' });
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });

  it('logs in an existing user instead of creating a duplicate', async () => {
    await request(app).post('/api/auth/signup').send(alice);
    const res = await request(app).post('/api/auth/google').send({ name: 'Alice', email: alice.email });
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('alice');
    expect(await User.countDocuments()).toBe(1);
  });

  it('uses the VERIFIED email when Firebase Admin is configured', async () => {
    firebaseAdmin.isConfigured.mockReturnValue(true);
    firebaseAdmin.verifyIdToken.mockResolvedValue({ email: 'real@gmail.com', name: 'Real User' });

    const res = await request(app)
      .post('/api/auth/google')
      .send({ email: 'victim@gmail.com', idToken: 'valid-token' });
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('real@gmail.com');
  });

  it('rejects an invalid ID token when Firebase Admin is configured', async () => {
    firebaseAdmin.isConfigured.mockReturnValue(true);
    firebaseAdmin.verifyIdToken.mockRejectedValue(new Error('bad token'));

    const res = await request(app).post('/api/auth/google').send({ email: 'x@gmail.com', idToken: 'forged' });
    expect(res.statusCode).toBe(401);
  });
});
