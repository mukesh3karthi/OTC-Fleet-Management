
"use strict";

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const KeyAccountUser = require("../models/KeyAccountUser");

const SALT_ROUNDS = 12;

async function createAccounts() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing.");
    }

    const accounts = [1, 2, 3, 4].map((number) => ({
      username: String(
        process.env[`KAM_${number}_USERNAME`] || ""
      ).trim().toLowerCase(),

      name: String(
        process.env[`KAM_${number}_NAME`] || ""
      ).trim(),

      password: String(
        process.env[`KAM_${number}_PASSWORD`] || ""
      ),
    }));

    // Validate all four accounts.
    for (const account of accounts) {
      if (
        !account.username ||
        !account.name ||
        account.password.length < 12 ||
        account.password.startsWith("REPLACE_WITH_")
      ) {
        throw new Error(
          "All four accounts require a username, name, " +
          "and password of at least 12 characters."
        );
      }
    }

    // Prevent duplicate usernames.
    const usernames = accounts.map(
      (account) => account.username
    );

    if (new Set(usernames).size !== 4) {
      throw new Error(
        "Each Key Account must have a different username."
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected.");

    await KeyAccountUser.init();

    for (const account of accounts) {
      const existing = await KeyAccountUser.findOne({
        username: account.username,
      }).select("+passwordHash");

      if (existing) {
        // Check password against the existing MongoDB hash.
        const passwordMatches =
          typeof existing.passwordHash === "string" &&
          await bcrypt.compare(
            account.password,
            existing.passwordHash
          );

        // Update password only when it has changed.
        if (!passwordMatches) {
          existing.passwordHash = await bcrypt.hash(
            account.password,
            SALT_ROUNDS
          );

          console.log(
            `Password updated: ${account.username}`
          );
        } else {
          console.log(
            `Password unchanged: ${account.username}`
          );
        }

        // Synchronize account details.
        existing.name = account.name;
        existing.role = "keyaccount";
        existing.active = true;

        await existing.save();

        console.log(
          `Account verified: ${account.username}`
        );

        continue;
      }

      // Create new account.
      const passwordHash = await bcrypt.hash(
        account.password,
        SALT_ROUNDS
      );

      await KeyAccountUser.create({
        username: account.username,
        name: account.name,
        passwordHash,
        role: "keyaccount",
        active: true,
      });

      console.log(
        `Account created: ${account.username}`
      );
    }

    console.log(
      "All four Key Account accounts synchronized successfully."
    );
  } catch (error) {
    console.error(
      "Key Account setup failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAccounts();
