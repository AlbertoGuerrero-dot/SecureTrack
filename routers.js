const express = require('express');
const router = express.Router();
const db = require('./database/db');
const bcrypt = require('bcrypt');
const passport = require('passport');
const {Strategy} = require('passport-local');
const session = require('express-session');
const bodyParser = require('body-parser');
const env = require('dotenv');
const axios = require('axios');

env.config()
const saltRounds = 10; 
const API_URL = "http://localhost:4000";

router.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
    })
  );

router.use(bodyParser.urlencoded({ extended: true }));
router.use(express.static("public"));

router.use(passport.initialize());
router.use(passport.session());

router.get('/', (req, res) => {
    res.send('Esto debería ser una pagina de inicio');
});

router.get("/login", (req, res) => {
    res.render("login.ejs");
});

router.get("/home", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("home.ejs");
      } else {
        res.redirect("/login");
      }
});

router.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

router.get("/paquete", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("paquete.ejs");
  } else {
    res.redirect("/login");
  }
});

router.get("/buscar", (req, res) => {
  res.render('buscar.ejs');
})


// RUTAS POST

router.post("/paquete", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const data = req.body;
      console.log(data);
      const response = await axios.post(`${API_URL}/shippingInfo`, data);
      console.log(response.data);
      res.redirect("/home");
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error sending data" });
    }
  } else {
    res.redirect("/login");
  }
});

router.post("/buscar", async(req, res) => {
  try {
    const qr = req.body.qr;
    const response = await axios.post(`${API_URL}/search`, { qr });
    res.send(response.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching data" });
  }
});

  router.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/home",
      failureRedirect: "/login",
    })
  );

  router.post("/register", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
  
    try {
      const checkResult = await db.query("SELECT * FROM usuarios WHERE usuario_nombre = $1", [
        username,
      ]);
  
      if (checkResult.rows.length > 0) {
        req.redirect("/login");
      } else {
        bcrypt.hash(password, saltRounds, async (err, hash) => {
          if (err) {
            console.error("Error hashing password:", err);
          } else {
            const result = await db.query(
              "INSERT INTO usuarios (usuario_nombre, password) VALUES ($1, $2) RETURNING *",
              [username, hash]
            );
            const user = result.rows[0];
            req.login(user, (err) => {
              console.log("success");
              res.redirect("/home");
            });
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  });

passport.use(
    new Strategy(async function verify(username, password, cb) {
      try {
        const result = await db.query("SELECT * FROM usuarios WHERE usuario_nombre = $1 ", [
          username,
        ]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.password;
          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              //Error with password check
              console.error("Error comparing passwords:", err);
              return cb(err);
            } else {
              if (valid) {
                //Passed password check
                return cb(null, user);
              } else {
                //Did not pass password check
                return cb(null, false);
              }
            }
          });
        } else {
          return cb("User not found");
        }
      } catch (err) {
        console.log(err);
      }
    })
  );
  
  passport.serializeUser((user, cb) => {
    cb(null, user);
  });
  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });

module.exports = router;