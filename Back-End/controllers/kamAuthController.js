const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const KeyAccountUser = require("../models/KeyAccountUser");

const loginKeyAccount = async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter username and password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured.",
      });
    }

    const user = await KeyAccountUser.findOne({
      username: username.trim().toLowerCase(),
    }).select("+passwordHash");

    if (
      !user ||
      !user.active ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const token = jwt.sign(
      { role: "keyaccount" },
      process.env.JWT_SECRET,
      {
        subject: String(user._id),
        audience: "keyaccount",
        issuer: "otc-fleet",
        algorithm: "HS256",
        expiresIn: "8h",
      }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        _id: String(user._id),
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Key Account login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login. Please try again.",
    });
  }
};

const getCurrentKeyAccount = (req, res) => {
  return res.json({
    success: true,
    user: {
      _id: String(req.user._id),
      username: req.user.username,
      name: req.user.name,
      role: req.user.role,
    },
  });
};

module.exports = {
  loginKeyAccount,
  getCurrentKeyAccount,
};