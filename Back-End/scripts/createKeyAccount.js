require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const KeyAccountUser = require("../models/KeyAccountUser");

async function createAccounts() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing.");
    }

    const accounts = [1, 2, 3, 4].map((number) => ({
      username: (
        process.env[`KAM_${number}_USERNAME`] || ""
      ).trim().toLowerCase(),

      name: (
        process.env[`KAM_${number}_NAME`] || ""
      ).trim(),

      password: process.env[`KAM_${number}_PASSWORD`] || "",
    }));

    // Validate all four before creating any accounts.
    for (const account of accounts) {
      if (
        !account.username ||
        !account.name ||
        account.password.length < 12 ||
        account.password.startsWith("REPLACE_WITH_")
      ) {
        throw new Error(
          "Provide all four usernames, names, and real passwords " +
          "of at least 12 characters."
        );
      }
    }

    if (
      new Set(accounts.map((account) => account.username)).size !== 4
    ) {
      throw new Error("Each account must have a different username.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    await KeyAccountUser.init();

    for (const account of accounts) {
      const existing = await KeyAccountUser.findOne({
        username: account.username,
      });

      if (existing) {
        console.log(
          `Already exists: ${account.username}. Password unchanged.`
        );
        continue;
      }

      const passwordHash = await bcrypt.hash(account.password, 12);

      await KeyAccountUser.create({
        username: account.username,
        name: account.name,
        passwordHash,
        role: "keyaccount",
        active: true,
      });

      console.log(`Created: ${account.username} — ${account.name}`);
    }

    console.log("Finished checking all four Key Account logins.");
  } catch (error) {
    console.error("Account creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAccounts();