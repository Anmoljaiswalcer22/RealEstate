const app = require('../app');
const request = require('supertest');
const db = require('./helpers/db');
const { loginAgent, sampleListing } = require('./helpers/factory');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const future = () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
const past = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

async function setup() {
  const owner = await loginAgent();
  const guest = await loginAgent();
  const { body: listing } = await owner.agent.post('/api/listing/create').send(sampleListing());
  return { owner, guest, listing };
}

describe('Bookings', () => {
  it('requires sign-in (401)', async () => {
    const res = await request(app).post('/api/booking/create').send({});
    expect(res.statusCode).toBe(401);
  });

  it('lets a guest book a property for a future date (201)', async () => {
    const { guest, listing } = await setup();
    const res = await guest.agent
      .post('/api/booking/create')
      .send({ listingId: listing._id, visitDate: future(), message: 'Can I visit on the weekend?' });
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('pending');
    expect(res.body.listingId.name).toBe(listing.name); // populated
  });

  it('rejects past dates (400)', async () => {
    const { guest, listing } = await setup();
    const res = await guest.agent.post('/api/booking/create').send({ listingId: listing._id, visitDate: past() });
    expect(res.statusCode).toBe(400);
  });

  it('rejects booking your own listing (400)', async () => {
    const { owner, listing } = await setup();
    const res = await owner.agent.post('/api/booking/create').send({ listingId: listing._id, visitDate: future() });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a duplicate pending booking (409)', async () => {
    const { guest, listing } = await setup();
    await guest.agent.post('/api/booking/create').send({ listingId: listing._id, visitDate: future() });
    const res = await guest.agent.post('/api/booking/create').send({ listingId: listing._id, visitDate: future() });
    expect(res.statusCode).toBe(409);
  });

  it('only the owner can confirm; the guest can cancel', async () => {
    const { owner, guest, listing } = await setup();
    const { body: booking } = await guest.agent
      .post('/api/booking/create')
      .send({ listingId: listing._id, visitDate: future() });

    const guestConfirm = await guest.agent.patch(`/api/booking/${booking._id}/status`).send({ status: 'confirmed' });
    expect(guestConfirm.statusCode).toBe(403);

    const ownerConfirm = await owner.agent.patch(`/api/booking/${booking._id}/status`).send({ status: 'confirmed' });
    expect(ownerConfirm.statusCode).toBe(200);
    expect(ownerConfirm.body.status).toBe('confirmed');

    const guestCancel = await guest.agent.patch(`/api/booking/${booking._id}/status`).send({ status: 'cancelled' });
    expect(guestCancel.statusCode).toBe(200);
    expect(guestCancel.body.status).toBe('cancelled');
  });

  it('lists my bookings and the bookings on my listings', async () => {
    const { owner, guest, listing } = await setup();
    await guest.agent.post('/api/booking/create').send({ listingId: listing._id, visitDate: future() });

    const mine = await guest.agent.get('/api/booking/user');
    expect(mine.body).toHaveLength(1);

    const incoming = await owner.agent.get('/api/booking/owner');
    expect(incoming.body).toHaveLength(1);
    expect(incoming.body[0].userId.username).toBe(guest.user.username);
  });
});
