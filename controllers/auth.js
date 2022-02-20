const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {
  clientId,
  clientSecret,
  user,
  refreshToken,
} = require("../util/config");
const { google } = require("googleapis");
const OAuth2_client = new google.auth.OAuth2(clientId, clientSecret);

const User = require("../models/user");

// const OAuth2_client = new OAuth2(config.clientId, config.clientSecret);

// console.log(refreshToken);
OAuth2_client.setCredentials({ refresh_token: refreshToken });

function sendMail(recipient, subject, message) {
  OAuth2_client.getAccessToken()
    .then((accessToken) => {
      const myAcessToken = accessToken.res.data.access_token;
      if (accessToken) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            type: "OAuth2",
            user: user,
            clientId: clientId,
            clientSecret: clientSecret,
            accessToken: myAcessToken,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
        const mailOptions = {
          from: "jokanola.it@gmail.com",
          to: recipient,
          subject: subject,
          html: message,
        };

        transporter.sendMail(mailOptions, (error, result) => {
          if (error) {
            console.log(error);
          } else {
            console.log("clientId", clientId);
            console.log(result);
          }
        });
      }
    })
    .catch((error) => console.log(error));
}

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message,
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash("error", "Invalid email or password.");
        return res.redirect("/login");
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            sendMail("Jokanola", email);
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          }
          req.flash("error", "Invalid email or password.");
          res.redirect("/login");
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  User.findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        req.flash(
          "error",
          "E-Mail exists already, please pick a different one."
        );
        return res.redirect("/signup");
      }
      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] },
          });
          return user.save();
        })
        .then((result) => {
          res.redirect("/login");
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (error, buffer) => {
    if (error) {
      console.log(error);
      res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({
      email: req.body.email,
    })
      .then((user) => {
        if (!user) {
          req.flash("error", "Can't find user with that email");
        }

        user.resetToken = token;
        user.tokenExpiryDate = Date.now() + 3600000;
        return user.save();
      })
      .then(() => {
        const subject = "Reset Password Link";
        const recipient = req.body.email;
        const message = `<h1>You requested for password reset link</h1><p> to reset you password try cliking the link below</p><br /><a href="http://localhost:3000/reset/${token}">Link</a>`;
        sendMail(recipient, subject, message);
        res.redirect("/login");
      })
      .catch((error) => console.log(error));
  });
};

exports.getExpiredPage = (req, res, next) => {
  res.render("auth/expire-token", {
    path: "/expire-token",
    pageTitle: "Expire Link",
  });
};
exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    tokenExpiryDate: { $gt: Date.now() },
  }).then((user) => {
    if (!user) {
      return res.redirect("/expire-token");
    }
    console.log("get user page", user);
    res.render("auth/new-password", {
      path: "/reset/:token",
      pageTitle: "Create New Password",
      userId: user._id,
      token: token,
    });
  });
};

exports.postUpdatePassword = (req, res, next) => {
  const token = req.body.token;
  const password = req.body.password;
  const userId = req.body.userId;

  let resetUser;
  User.findOne({
    resetToken: token,
    tokenExpiryDate: { $gt: Date.now() },
    _id: userId,
  })
    .then((result) => {
      resetUser = result;
      return bcrypt.hash(password, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((error) => console.log(error));
};
