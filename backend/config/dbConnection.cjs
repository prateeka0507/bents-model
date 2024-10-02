const mongoose = require("mongoose");
require('dotenv').config(); // Load environment variables from .env

// Get the connection string from the environment variable
const CONNECTION_STRING = process.env.MONGO_DRIVER;

const connectDb = async () => {
  try {
    const connect = await mongoose.connect(CONNECTION_STRING);
    console.log(
      `Database connected: ${connect.connection.host} (DB: ${connect.connection.name})`
    );
  } catch (err) {
    console.error("Error connecting to database:", err.message);
    process.exit(1); // Exit the process with failure
  }
};

module.exports = connectDb;
