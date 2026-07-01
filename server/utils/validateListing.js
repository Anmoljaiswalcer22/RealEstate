// Business rules that Mongoose schema validation can't express on its own
// (rules involving several fields, like discount vs regular price).

const ALLOWED_FIELDS = [
  'name',
  'description',
  'address',
  'regularPrice',
  'discountPrice',
  'bedrooms',
  'bathrooms',
  'furnished',
  'parking',
  'offer',
  'type',
  'imageUrls',
];

// Whitelist: only these fields can come from the request body (userRef can't be spoofed)
function pickListingFields(body = {}) {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

// Returns an error message, or null if the listing is valid
function validateListingInput(data) {
  for (const field of ['name', 'description', 'address']) {
    if (typeof data[field] !== 'string' || !data[field].trim()) return `${field} is required`;
  }
  for (const field of ['regularPrice', 'bedrooms', 'bathrooms']) {
    if (typeof data[field] !== 'number' || Number.isNaN(data[field])) return `${field} must be a number`;
  }
  if (data.discountPrice !== undefined && (typeof data.discountPrice !== 'number' || Number.isNaN(data.discountPrice))) {
    return 'discountPrice must be a number';
  }
  if (!['rent', 'sale'].includes(data.type)) return "type must be 'rent' or 'sale'";
  for (const field of ['furnished', 'parking', 'offer']) {
    if (data[field] !== undefined && typeof data[field] !== 'boolean') return `${field} must be true or false`;
  }
  if (data.offer && !(data.discountPrice < data.regularPrice)) {
    return 'Discount price must be lower than regular price';
  }
  if (!Array.isArray(data.imageUrls) || data.imageUrls.length < 1) return 'At least 1 image is required';
  if (data.imageUrls.length > 6) return 'You can upload at most 6 images';
  if (!data.imageUrls.every((url) => typeof url === 'string' && url.length > 0 && url.length < 2048)) {
    return 'Invalid image URL';
  }
  return null;
}

module.exports = { ALLOWED_FIELDS, pickListingFields, validateListingInput };
