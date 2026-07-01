// In-memory MongoDB: tests never touch your real Atlas data.
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;

async function connect() {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  // Build unique indexes before tests run (needed for the duplicate-email test)
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));
}

async function clear() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

async function close() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
}

module.exports = { connect, clear, close };
