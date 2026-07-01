const request = require('supertest');
const app = require('../../app');

let counter = 0;

const makeUser = () => {
  counter += 1;
  return { username: `user${counter}`, email: `user${counter}@test.com`, password: 'secret123' };
};

// Returns a supertest agent that keeps cookies, like a logged-in browser
async function loginAgent(user = makeUser()) {
  const agent = request.agent(app);
  await agent.post('/api/auth/signup').send(user).expect(201);
  const res = await agent.post('/api/auth/signin').send({ email: user.email, password: user.password }).expect(200);
  return { agent, user: res.body };
}

const sampleListing = (overrides = {}) => ({
  name: 'Sunny 2BHK Apartment',
  description: 'Bright apartment close to the metro.',
  address: '12 MG Road, Bengaluru',
  regularPrice: 25000,
  discountPrice: 0,
  bedrooms: 2,
  bathrooms: 2,
  furnished: true,
  parking: false,
  offer: false,
  type: 'rent',
  imageUrls: ['/uploads/sample.jpg'],
  ...overrides,
});

module.exports = { makeUser, loginAgent, sampleListing };
