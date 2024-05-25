const express = require('express');
const router = express.Router();
const db = require('./database/db');
const bcrypt = require('bcrypt');
const passport = require('passport');
const {Strategy} = require('passport-local');
const session = require('express-session');
const bodyParser = require('body-parser');

const saltRounds = 10; 

router.use(
    session({
      secret: "TOPSECRETWORD",
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
    res.send("aquí debería ir un login");
});

router.get("/paquetes", (req, res) => {
    if (req.isAuthenticated()) {
        res.send("Agregar un nuevo paquete");
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

  router.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/paquetes",
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
              res.redirect("/paquetes");
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