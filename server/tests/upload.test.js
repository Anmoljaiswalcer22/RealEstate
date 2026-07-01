const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../app');
const db = require('./helpers/db');
const { loginAgent } = require('./helpers/factory');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

// A real 1x1 PNG image
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

describe('POST /api/upload', () => {
  it('requires sign-in (401)', async () => {
    const res = await request(app).post('/api/upload').attach('images', PNG, { filename: 'a.png', contentType: 'image/png' });
    expect(res.statusCode).toBe(401);
  });

  it('saves real images and returns their URLs (201)', async () => {
    const { agent } = await loginAgent();
    const res = await agent
      .post('/api/upload')
      .attach('images', PNG, { filename: 'a.png', contentType: 'image/png' })
      .attach('images', PNG, { filename: 'b.png', contentType: 'image/png' });

    expect(res.statusCode).toBe(201);
    expect(res.body.urls).toHaveLength(2);
    const saved = path.join(process.env.UPLOAD_DIR, path.basename(res.body.urls[0]));
    expect(fs.existsSync(saved)).toBe(true);
  });

  it('rejects a non-image MIME type (400)', async () => {
    const { agent } = await loginAgent();
    const res = await agent
      .post('/api/upload')
      .attach('images', Buffer.from('hello'), { filename: 'notes.txt', contentType: 'text/plain' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a script disguised as an image (400)', async () => {
    const { agent } = await loginAgent();
    const res = await agent
      .post('/api/upload')
      .attach('images', Buffer.from('<script>alert("hi")</script>'), { filename: 'photo.png', contentType: 'image/png' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/not a valid image/);
  });

  it('rejects files over 2 MB (400)', async () => {
    const { agent } = await loginAgent();
    const big = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]);
    const res = await agent.post('/api/upload').attach('images', big, { filename: 'big.png', contentType: 'image/png' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/2 MB/);
  });
});
