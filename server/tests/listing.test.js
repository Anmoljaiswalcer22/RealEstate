const request = require('supertest');
const app = require('../app');
const db = require('./helpers/db');
const { loginAgent, sampleListing } = require('./helpers/factory');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

describe('Listing CRUD', () => {
  it('rejects creating a listing without signing in (401)', async () => {
    const res = await request(app).post('/api/listing/create').send(sampleListing());
    expect(res.statusCode).toBe(401);
  });

  it('creates a listing owned by the signed-in user (201)', async () => {
    const { agent, user } = await loginAgent();
    const res = await agent.post('/api/listing/create').send(sampleListing());
    expect(res.statusCode).toBe(201);
    expect(res.body.userRef).toBe(user._id);
  });

  it('ignores a spoofed userRef in the body', async () => {
    const { agent, user } = await loginAgent();
    const res = await agent
      .post('/api/listing/create')
      .send(sampleListing({ userRef: '64b7f0c2a1b2c3d4e5f60718' }));
    expect(res.body.userRef).toBe(user._id);
  });

  it('rejects a discount price that is not lower than the regular price (400)', async () => {
    const { agent } = await loginAgent();
    const res = await agent
      .post('/api/listing/create')
      .send(sampleListing({ offer: true, regularPrice: 1000, discountPrice: 1500 }));
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/discount/i);
  });

  it('rejects more than 6 images (400)', async () => {
    const { agent } = await loginAgent();
    const imageUrls = Array.from({ length: 7 }, (_, i) => `/uploads/${i}.jpg`);
    const res = await agent.post('/api/listing/create').send(sampleListing({ imageUrls }));
    expect(res.statusCode).toBe(400);
  });

  it('rejects an invalid type value (400)', async () => {
    const { agent } = await loginAgent();
    const res = await agent.post('/api/listing/create').send(sampleListing({ type: 'lease' }));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for a malformed id and 404 for a missing listing', async () => {
    expect((await request(app).get('/api/listing/get/not-an-id')).statusCode).toBe(400);
    expect((await request(app).get('/api/listing/get/64b7f0c2a1b2c3d4e5f60718')).statusCode).toBe(404);
  });

  it('lets the owner update and delete their listing', async () => {
    const { agent } = await loginAgent();
    const { body: listing } = await agent.post('/api/listing/create').send(sampleListing());

    const updated = await agent.post(`/api/listing/update/${listing._id}`).send({ name: 'Renovated 2BHK' });
    expect(updated.statusCode).toBe(200);
    expect(updated.body.name).toBe('Renovated 2BHK');

    const deleted = await agent.delete(`/api/listing/delete/${listing._id}`);
    expect(deleted.statusCode).toBe(200);
    expect((await request(app).get(`/api/listing/get/${listing._id}`)).statusCode).toBe(404);
  });

  it("returns 403 when updating or deleting someone else's listing", async () => {
    const owner = await loginAgent();
    const stranger = await loginAgent();
    const { body: listing } = await owner.agent.post('/api/listing/create').send(sampleListing());

    const update = await stranger.agent.post(`/api/listing/update/${listing._id}`).send({ name: 'Hacked' });
    expect(update.statusCode).toBe(403);

    const del = await stranger.agent.delete(`/api/listing/delete/${listing._id}`);
    expect(del.statusCode).toBe(403);
  });
});

describe('GET /api/listing/get (search, filters, pagination)', () => {
  beforeEach(async () => {
    const { agent } = await loginAgent();
    await agent.post('/api/listing/create').send(sampleListing({ name: 'Cosy Studio', type: 'rent', regularPrice: 9000 }));
    await agent.post('/api/listing/create').send(sampleListing({ name: 'Family Villa', type: 'sale', regularPrice: 9000000, parking: true }));
    await agent
      .post('/api/listing/create')
      .send(sampleListing({ name: 'Garden Flat', type: 'rent', regularPrice: 20000, offer: true, discountPrice: 18000 }));
  });

  it('filters by type', async () => {
    const res = await request(app).get('/api/listing/get?type=rent');
    expect(res.body).toHaveLength(2);
    expect(res.body.every((l) => l.type === 'rent')).toBe(true);
  });

  it('searches names case-insensitively', async () => {
    const res = await request(app).get('/api/listing/get?searchTerm=villa');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Family Villa');
  });

  it('treats regex characters in the search term as plain text', async () => {
    const res = await request(app).get('/api/listing/get?searchTerm=.*');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('applies boolean filters', async () => {
    expect((await request(app).get('/api/listing/get?offer=true')).body).toHaveLength(1);
    expect((await request(app).get('/api/listing/get?parking=true')).body).toHaveLength(1);
  });

  it('sorts by price and paginates', async () => {
    const sorted = await request(app).get('/api/listing/get?sort=regularPrice&order=asc');
    expect(sorted.body.map((l) => l.regularPrice)).toEqual([9000, 20000, 9000000]);

    const page2 = await request(app).get('/api/listing/get?sort=regularPrice&order=asc&limit=1&startIndex=1');
    expect(page2.body).toHaveLength(1);
    expect(page2.body[0].regularPrice).toBe(20000);
  });
});
