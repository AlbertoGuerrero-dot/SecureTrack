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
      cookie: { secure: false }
    })
  );

router.use(bodyParser.urlencoded({ extended: true }));
router.use(express.static("public"));

router.use(passport.initialize());
router.use(passport.session());

function checkRole(role) {
  return function(req, res, next) {
    if (req.isAuthenticated() && req.user.puesto === role) {
      return next();
    } else {
      res.redirect('/login');
    }
  };
}

// RUTAS GET 
router.get('/', (req, res) => {
    res.render('landingPage.ejs');
});

router.get("/login", (req, res) => {
    res.render("login.ejs");
});

router.get("/secureTrack", checkRole('Admin'), (req, res) => {
  res.render('secureTrack.ejs');
});

router.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

router.get("/paquete", checkRole('Admin'), (req, res) => {
  res.render('paquete.ejs');
});

router.get("/buscar", (req, res) => {
  res.render('buscar.ejs', { data: null });
})

router.get("/inspeccion", checkRole('Inspector de Aduanas'), (req, res) => {
  res.render('inspeccion.ejs');
});

router.get("/registrar", checkRole('Admin'), (req, res) => {
  res.render('registrar.ejs');
});

router.get("/createInspection", checkRole('Inspector de Aduanas'), (req, res) => {
  res.render('createInspection.ejs')
})

// RUTAS POST

router.post("/paquete", checkRole('Admin'), async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const data = req.body;
      console.log(data);
      const response = await axios.post(`${API_URL}/shippingInfo`, data);
      console.log(response.data);
      res.redirect("/secureTrack");
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error sending data" });
    }
  } else {
    res.redirect("/login");
  }
});

router.post("/buscar", async (req, res) => {
  try {
    const qr = req.body.qr;
    const response = await axios.post(`${API_URL}/search`, { qr });
    const data = response.data.length > 0 ? response.data[0] : null; // Asegurarse de obtener el primer elemento
    res.render('buscar.ejs', { data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching data" });
  }
});

router.post('/login', passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: true
}), (req, res) => {
  // Redirige según el rol del usuario
  if (req.user.puesto === 'Admin') {
    res.redirect('/secureTrack');
  } else if (req.user.puesto === 'Inspector de Aduanas') {
    res.redirect('/inspeccion');
  } else {
    res.redirect('/');
  }
});

router.post("/registrar", checkRole('Admin'), async (req, res) => {
  const data = req.body;
  console.log(data);
  try {
    const checkResult = await db.query("SELECT * FROM empleados WHERE nombre = $1", [
      data.username
    ]);

    if (checkResult.rows.length > 0) {
      res.redirect("/secureTrack");
    } else {
      bcrypt.hash(data.password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
          res.redirect("/secureTrack"); // Puedes redirigir a una página de error o mostrar un mensaje de error
        } else {
          const result = await db.query(
            "INSERT INTO empleados (nombre, puesto, telefono, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [data.username, data.puesto, data.telefono, data.email, hash]
          );
          // No necesitas llamar a req.login aquí
          console.log("User successfully registered:", result.rows[0]);
          res.redirect("/secureTrack");
        }
      });
    }
  } catch (err) {
    console.log(err);
    res.redirect("/secureTrack"); // Manejar errores y redirigir adecuadamente
  }
});

router.post("/inspeccion", checkRole('Inspector de Aduanas'), async (req, res) => {
  console.log(req.user)
  console.log(req.body)
  try {
    const qr = req.body.qr;
    const response = await axios.post(`${API_URL}/search`, { qr });
    req.session.paquete = response.data;
    res.redirect("/createInspection");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching data" });
  }
})

router.post("/createInspection", checkRole('Inspector de Aduanas'), async (req, res) => {
  
  if (!req.session.paquete) {
    return res.status(400).json({ message: "No package data found in session" });
  }

  data = {
    paquete: req.session.paquete,
    empleado: req.user.empleado_id,
    fecha_inspeccion: new Date(),
    resultado: req.body.resultado,
    comentarios: req.body.comentarios
  }

  if (req.isAuthenticated()) {
    try {
      const response = await axios.post(`${API_URL}/inspection`, data);
      console.log(response.data);
      req.session.paquete = null;
      res.redirect("/inspeccion");
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error sending data" });
    }
  } else {
    res.redirect("/login");
  }

});


  passport.use(
    new Strategy(async function verify(username, password, cb) {
      try {
        const result = await db.query("SELECT * FROM empleados WHERE nombre = $1", [username]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.password;
          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              console.error("Error comparing passwords:", err);
              return cb(err);
            } else {
              if (valid) {
                return cb(null, user); // El objeto user incluirá todas las columnas de la tabla empleados, incluyendo el rol
              } else {
                return cb(null, false);
              }
            }
          });
        } else {
          return cb(null, false, { message: 'User not found' });
        }
      } catch (err) {
        console.log(err);
        return cb(err);
      }
    })
  );
  
// Serializar y deserializar usuario
passport.serializeUser(function(user, cb) {
  cb(null, user.empleado_id); // Asegúrate de que user.id está disponible
});

passport.deserializeUser(async function(id, cb) {
  try {
    const result = await db.query("SELECT * FROM empleados WHERE empleado_id = $1", [id]);
    if (result.rows.length > 0) {
      cb(null, result.rows[0]);
    } else {
      cb(new Error("User not found"));
    }
  } catch (err) {
    cb(err);
  }
});

module.exports = router;