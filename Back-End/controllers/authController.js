const jwt = require("jsonwebtoken");

const login = (req, res) => {
  try {
    const username = String(
      req.body.username || ""
    ).trim();

    const password = String(
      req.body.password || ""
    );

    if (!username && !password) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter username and password.",
      });
    }

    if (!username) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter username.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter password.",
      });
    }

    const validUsername =
      process.env.ADMIN_USERNAME ||
      "mukesh";

    const validPassword =
      process.env.ADMIN_PASSWORD ||
      "OTC@2026";

    if (
      username !== validUsername ||
      password !== validPassword
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid username or password.",
      });
    }

    const jwtSecret =
      process.env.JWT_SECRET ||
      "otc_fleet_secret_2026";

    const token = jwt.sign(
      {
        username: validUsername,
      },
      jwtSecret,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Login successful.",
      token,
      user: {
        username: validUsername,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to login. Please try again.",
    });
  }
};

module.exports = {
  login,
};