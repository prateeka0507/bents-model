const mongoose = require("mongoose");
require('dotenv').config(); // Load environment variables from .env

// Correct the connection string
const CONNECTION_STRING = "mongodb+srv://mohamedrasheq:rasheq@cluster0.vsdcw.mongodb.net/bents-contact?retryWrites=true&w=majority&appName=Cluster0";

const connectDb = async () => {
  try {
    const connect = await mongoose.connect(CONNECTION_STRING); // No need for deprecated options

    console.log(
      `Database connected: ${connect.connection.host} (DB: ${connect.connection.name})`
    );
  } catch (err) {
    console.error("Error connecting to database:", err.message);
    process.exit(1); // Exit the process with failure
  }
};

module.exports = connectDb;
