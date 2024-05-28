const bcrypt = require('bcrypt');
const saltRounds = 10;
const db = require('./database/db');

const data = {
    username: "admin",
    puesto: "Admin",
    telefono: "123-456",
    email: "eladmin@mail.com",
    password: "1234"
}

bcrypt.hash(data.password, saltRounds, async (err, hash) => {
    if (err) {
      console.error("Error hashing password:", err);
    } else {
      const result = await db.query(
        "INSERT INTO empleados (nombre, puesto, telefono, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [data.username, data.puesto, data.telefono, data.email, hash]
      );
      // No necesitas llamar a req.login aquí
      console.log("User successfully registered:", result.rows[0]);
      console.log(hash)
    }
  });