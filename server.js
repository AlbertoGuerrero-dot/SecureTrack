const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = require('./database/db');
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.post("/search", async (req, res) => {
    const qr = req.body.qr;
    console.log(qr);
    try {
      const result = await db.query("SELECT * FROM paquetes WHERE codigo_qr = $1", [
        qr
      ]);
      const items = result.rows;
      res.json(items); 
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error fetching data" });
    }
  });

  app.post("/shippingInfo", async (req, res) => {
    const data = req.body;
    try {
      const remitent = {
        nombre_remitente: data.nombre_remitente,
        direccion_remitente: data.direccion_remitente,
        telefono_remitente: data.telefono_remitente,
        email_remitente: data.email_remitente
      };
  
      const destinatary = {
        nombre_destinatario: data.nombre_destinatario,
        direccion_destinatario: data.direccion_destinatario,
        telefono_destinatario: data.telefono_destinatario,
        email_destinatario: data.email_destinatario
      };
  
      const insertRemitent = await db.query(
        "INSERT INTO remitentes (nombre, direccion, telefono, email) VALUES ($1, $2, $3, $4) RETURNING *",
        [
          remitent.nombre_remitente,
          remitent.direccion_remitente,
          remitent.telefono_remitente,
          remitent.email_remitente
        ]
      );
  
      const insertDestinatary = await db.query(
        "INSERT INTO destinatarios (nombre, direccion, telefono, email) VALUES ($1, $2, $3, $4) RETURNING *",
        [
          destinatary.nombre_destinatario,
          destinatary.direccion_destinatario,
          destinatary.telefono_destinatario,
          destinatary.email_destinatario
        ]
      );
  
      const items = insertDestinatary.rows;
      const items2 = insertRemitent.rows;
      res.json({ destinatary: items, remitent: items2 });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error inserting data" });
    }
  });
  


  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  