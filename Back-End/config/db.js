const mongoose = require("mongoose");

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is missing from the backend .env file."
    );
  }

  const connection =
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

  console.log(
    `MongoDB connected: ${connection.connection.host}`
  );

  console.log(
    `Database: ${connection.connection.name}`
  );
};

mongoose.connection.on(
  "disconnected",
  () => {
    console.warn(
      "MongoDB disconnected."
    );
  }
);

mongoose.connection.on(
  "error",
  (error) => {
    console.error(
      "MongoDB connection error:",
      error.message
    );
  }
);

module.exports = connectDatabase;