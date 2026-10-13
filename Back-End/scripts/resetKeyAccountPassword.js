require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const KeyAccountUser = require("../models/KeyAccountUser");

async function resetPassword() {
  try {
    const username = (
      process.env.KAM_1_USERNAME || ""
    ).trim().toLowerCase();

    const password = process.env.KAM_1_PASSWORD || "";

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing.");
    }

    if (!username || password.length < 12) {
      throw new Error(
        "Set KAM_1_USERNAME and a password of at least 12 characters."
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const user = await KeyAccountUser.findOne({ username });

    if (!user) {
      throw new Error("Key Account not found.");
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();

    console.log(`Password updated for ${username}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

resetPassword();