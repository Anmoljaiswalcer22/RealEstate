// Never send the password hash (or refresh token hash) back to the client.
const sanitizeUser = (user) => {
  const doc = user._doc ? user._doc : user;
  const { password, refreshTokenHash, __v, ...rest } = doc;
  return rest;
};

module.exports = sanitizeUser;
