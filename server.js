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
    const result = await db.query(`
    SELECT
  p.paquete_id,
  p.codigo_qr,
  p.descripcion,
  p.fecha_envio,
  p.fecha_estimada_entrega,
  r.nombre AS remitente_nombre,
  r.direccion AS remitente_direccion,
  r.telefono AS remitente_telefono,
  r.email AS remitente_email,
  d.nombre AS destinatario_nombre,
  d.direccion AS destinatario_direccion,
  d.telefono AS destinatario_telefono,
  d.email AS destinatario_email,
  e.estado,
  e.comentario AS estado_comentario,
  e.ubicacion AS estado_ubicacion,
  i.fecha_inspeccion,
  i.resultado AS inspeccion_resultado,
  i.comentarios AS inspeccion_comentario
FROM
  paquetes p
LEFT JOIN
  remitentes r ON p.remitente_id = r.remitente_id
LEFT JOIN
  destinatarios d ON p.destinatario_id = d.destinatario_id
LEFT JOIN
  estado e ON p.estado_id = e.estado_id
LEFT JOIN
  inspecciones i ON p.paquete_id = i.paquete_id
WHERE
  p.codigo_qr = $1;
    `, [qr]);

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
      nombre: data.nombre_remitente,
      direccion: data.direccion_remitente,
      telefono: data.telefono_remitente,
      email: data.email_remitente
    };

    const destinatary = {
      nombre: data.nombre_destinatario,
      direccion: data.direccion_destinatario,
      telefono: data.telefono_destinatario,
      email: data.email_destinatario
    };

    const insertRemitent = await db.query(
      "INSERT INTO remitentes (nombre, direccion, telefono, email) VALUES ($1, $2, $3, $4) RETURNING remitente_id",
      [
        remitent.nombre,
        remitent.direccion,
        remitent.telefono,
        remitent.email
      ]
    );

    const insertDestinatary = await db.query(
      "INSERT INTO destinatarios (nombre, direccion, telefono, email) VALUES ($1, $2, $3, $4) RETURNING destinatario_id",
      [
        destinatary.nombre,
        destinatary.direccion,
        destinatary.telefono,
        destinatary.email
      ]
    );

    const remitentId = insertRemitent.rows[0].remitente_id;
    const destinataryId = insertDestinatary.rows[0].destinatario_id;

    const insertPaquete = await db.query(
      "INSERT INTO paquetes (codigo_qr, descripcion, fecha_envio, fecha_estimada_entrega, remitente_id, destinatario_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        data.codigo_qr,
        data.descripcion,
        data.fecha_envio,
        data.fecha_estimada_entrega,
        remitentId,
        destinataryId
      ]
    );

    const paquete = insertPaquete.rows[0];
    res.json({ paquete });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error inserting data" });
  }
});

  app.post('/inspection', async (req, res) => {
    try {
    const paquete = req.body.paquete[0]; // Acceder al primer (y único) paquete en el array
    const empleado = req.body.empleado;
    const fecha_inspeccion = new Date(req.body.fecha_inspeccion); // Convertir a objeto Date
    const resultado = req.body.resultado;
    const comentarios = req.body.comentarios;

    const result = await db.query(
      "INSERT INTO inspecciones (paquete_id, empleado_id, fecha_inspeccion, resultado, comentarios) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [paquete.paquete_id, empleado, fecha_inspeccion, resultado, comentarios]
    );

    const items = result.rows;
    res.json(items);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error creating inspection record" });
    }
  })

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  