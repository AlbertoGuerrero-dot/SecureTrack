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
      console.log(remitente);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error fetching data" });
    }
  });

app.post("/shippingInfo",(req,res) => {
    // DATOS DE ENVIO (REMITENTE , DESTINATARIO FECHAS)
});


  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  