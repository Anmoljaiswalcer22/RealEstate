// Unit tests: one function at a time, no database or HTTP
const { errorHandler } = require('../utils/error');
const sanitizeUser = require('../utils/sanitizeUser');
const { validateListingInput, pickListingFields } = require('../utils/validateListing');
const { detectImageType } = require('../controllers/upload.controller');
const errorMiddleware = require('../middleware/error.middleware');

const valid = {
  name: 'Flat',
  description: 'Nice',
  address: 'Somewhere',
  regularPrice: 100,
  bedrooms: 1,
  bathrooms: 1,
  type: 'sale',
  imageUrls: ['/uploads/a.jpg'],
};

describe('errorHandler', () => {
  it('creates an Error with a status code', () => {
    const err = errorHandler(403, 'Forbidden');
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Forbidden');
  });
});

describe('error middleware', () => {
  const run = (err) => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorMiddleware(err, {}, res, () => {});
    return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
  };

  it('formats custom errors consistently', () => {
    expect(run(errorHandler(404, 'Not here'))).toEqual({
      status: 404,
      body: { success: false, statusCode: 404, message: 'Not here' },
    });
  });

  it('turns duplicate-key errors into 409', () => {
    const { status, body } = run({ code: 11000, keyValue: { email: 'a@b.com' } });
    expect(status).toBe(409);
    expect(body.message).toBe('Email already exists');
  });

  it('defaults to 500', () => {
    expect(run(new Error('boom')).status).toBe(500);
  });
});

describe('sanitizeUser', () => {
  it('removes password and refresh token hash', () => {
    const out = sanitizeUser({ _doc: { _id: '1', email: 'a@b.com', password: 'hash', refreshTokenHash: 'x' } });
    expect(out).toEqual({ _id: '1', email: 'a@b.com' });
  });
});

describe('validateListingInput', () => {
  it('accepts a valid listing', () => {
    expect(validateListingInput(valid)).toBeNull();
  });

  it('requires discount < regular price when offer is on', () => {
    expect(validateListingInput({ ...valid, offer: true, discountPrice: 100 })).toMatch(/discount/i);
    expect(validateListingInput({ ...valid, offer: true, discountPrice: 90 })).toBeNull();
  });

  it('enforces 1 to 6 images', () => {
    expect(validateListingInput({ ...valid, imageUrls: [] })).toMatch(/at least 1/i);
    expect(validateListingInput({ ...valid, imageUrls: Array(7).fill('/u.jpg') })).toMatch(/at most 6/i);
  });

  it('rejects numbers sent as strings', () => {
    expect(validateListingInput({ ...valid, regularPrice: '100' })).toMatch(/number/);
  });
});

describe('pickListingFields', () => {
  it('drops fields that are not allowed', () => {
    expect(pickListingFields({ name: 'x', userRef: 'hacker', _id: '1' })).toEqual({ name: 'x' });
  });
});

describe('detectImageType', () => {
  it('detects PNG and JPEG by magic bytes', () => {
    expect(detectImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]))).toBe('png');
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe('jpg');
  });

  it('rejects text', () => {
    expect(detectImageType(Buffer.from('definitely not an image'))).toBeNull();
  });
});
