const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log('Mongoose Connected');
  } catch (err) {
    console.error(err.message);
    // Exit the Application with faliure
    process.exit(1);
  }
};

module.exports = connectDB;
