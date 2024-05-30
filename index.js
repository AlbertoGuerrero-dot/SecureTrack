const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('node_modules'));
const router = require('./routers');
app.use('/', router);

 
app.listen(PORT, ()=> { 
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});