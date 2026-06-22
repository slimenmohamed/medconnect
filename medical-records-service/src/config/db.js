const mongoose = require('mongoose');

async function connectMongo(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { autoIndex: true });
  console.log('[mongo] Connected:', uri.replace(/\/\/.*@/, '//***@'));
}

module.exports = { connectMongo };
