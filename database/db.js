const pg = require('pg');

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "securetrack",
    password: "1234",
    port: "5432"
})

db.connect();

module.exports = db;