var express = require("express");
var db = require("./api/models/db.js");

var port = process.env.PORT || 1337;

// Set up the express app
const app = express();

app.get('/backend/nodejs/api/estaciones', (req, res) => {
    // Leemos los datos del fichero GeoJSON y los enviamos al cliente
    var estaciones = db.obtenerEstaciones();
    estaciones.then(function(result) 
    {
        res.status(200).send(result);
    }, function(err) 
    {
        console.log(err);
        res.status(200).send(err);
    })
});

app.get('/backend/nodejs/api/ultimoDatoEstacion', (req, res) => {
    // Obtenemos los datos de la base de datos Sqlite
    var datosEstaciones = [{"id": 10}, {"id": 15}];
    res.status(200).send(datosEstaciones);
});

app.get('/backend/nodejs/api/ultimoDatoEstacion/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    // Obtenemos los datos de la base de datos Sqlite filtrando por el ID de estación proporcionado
    var datosEstacion = db.obtenerDatosEstacion(id);
    datosEstacion.then(function(result) {
        res.status(200).send(result);
        //console.log(result);
        //res.status(200).send(result);
        //res.status(200).send({"Provincia": result[0].PROVINCIA});
    }, function(err) {
        console.log(err);
    })
});


app.listen(port, () => {
  console.log(`server running on port ${port}`)
});
