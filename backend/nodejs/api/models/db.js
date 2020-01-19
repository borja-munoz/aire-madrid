var sqlite3 = require('sqlite3').verbose();
var fs = require("fs");
var csv = require("csvtojson");

var Estacion = require("./Estacion.js");

function abrirConexion(modo)
{
    var path;

    // Distinguimos entre despliegue en Azure o Local
    // Todavía no he averiguado la ruta relativa al fichero
    if (__dirname.startsWith("D:"))
    {
        path = 'D:\\home\\site\\wwwroot\\data\\aire-madrid.db';
    }
    else
    {
        path = "data/aire-madrid.db";
    }

    try 
    {
        if (fs.existsSync(path)) 
        {
            console.log("Existe");
        }
        else
        {
            console.log("Fichero no existe: " + path + " - " + __dirname);
            return(null);
        }
    } 
    catch(err) 
    {
        console.log(err);
        return(null);
    }

    conexion = new sqlite3.Database(path, modo, (err) => 
    {
        if (err) 
        {
            console.error(err.message);
            return(null);
        }
        else
        {
            console.log('Conectado a la base de datos');
        }
    });

    return(conexion);
}

function cerrarConexion(conexion)
{
    conexion.close((err) => 
    {
        if (err) 
        {
            console.error(err.message);
        }
        console.log('Conexión a la base de datos cerrada');
    });
}

function ejecutarConsulta(consulta)
{
    return new Promise(function(resolve, reject) 
    {
        var conexion;
    
        conexion = abrirConexion(sqlite3.OPEN_READONLY);

        if (conexion != null)
        {
            conexion.all(consulta, (err, rows) => 
            {
                if (err) 
                {
                    console.error(err.message);
                    reject(err);
                }
                else
                {
                    resolve(rows);
                }
                cerrarConexion(conexion);
            });
        }
        else
        {
            reject("No se ha podido abrir la conexión a la base de datos.")
        }
    });
}

function ejecutarSentencia(sentencia)
{
    return new Promise(function(resolve, reject) 
    {
        var conexion;
    
        conexion = abrirConexion(sqlite3.OPEN_READWRITE);

        if (conexion != null)
        {
            conexion.run(sentencia, function(err) 
            {
                if (err) 
                {
                    console.error(err.message);
                    reject(err);
                }
                else
                {
                    console.log("Fila insertada con rowid ${this.lastID}");
                    resolve(this.lastID);
                }
                cerrarConexion(conexion);
            });
        }
        else
        {
            reject("No se ha podido abrir la conexión a la base de datos.")
        }
    });
}

// Función que recupera el último fichero disponible y actualiza la base de datos
function actualizarDatos()
{
    return new Promise(function(resolve, reject) 
    {
        var ultimosDatos = obtenerUltimosDatos();
        ultimosDatos.then(function(results)
        {
            // Actualizamos la base de datos Sqlite
            var sentencia;
            results.forEach((result) => 
            {
                // El formato del punto de muestreo es:
                // ESTACION_MAGNITUD_TECNICA
                var codigoEstacion, idMagnitud, idTecnica;
                var puntoMuestreo = result.PUNTO_MUESTREO.split("_");
                codigoEstacion = puntoMuestreo[0];
                idMagnitud = puntoMuestreo[1];

                var fecha = result.ANO + "-" +  result.MES + "-" + result.DIA;

                var nombreCampoValor, nombreCampoValorValido;
                for (var i = 1; i <= 24; i++)
                {
                    nombreCampoValorValido = "V" + ("0" + i).slice(-2);
                    nombreCampoValor = "H" + ("0" + i).slice(-2);
                    if (result[nombreCampoValorValido] == "V")
                    {
                        valor = result[nombreCampoValor];

                        // Optimizar insertando varios valores al mismo tiempo
                        sentencia = "INSERT INTO MEDICIONES (FECHA, " + 
                                                            "VALOR, " +
                                                            "ID_ESTACION, " +
                                                            "ID_MAGNITUD) " +
                                                    "VALUES (" + fecha + ("0" + i).slice(-2) + ":00:00.000" + ", " +
                                                            + valor + ", " + 
                                                            + "SELECT ID FROM ESTACIONES WHERE CODIGO_ESTACION = " + codigoEstacion + ", " +
                                                            + idMagnitud + ")";
                        var resultado = ejecutarSentencia(sentencia);
                        
                        resultado.then(function(id)
                        {
                            //resolve(rows[0].HORA_ACTUALIZACION);
                        },
                        function(err)
                        {
                            console.log(err);
                            reject(null);
                        });            

                    }
                    else
                    {
                        break;
                    }
                }
            });    
        }, 
        function(err) 
        {
            console.log(err);
        });
    });
}

function obtenerUltimosDatos()
{
    var request = require('request');
    var options = {
        url: 'https://datos.madrid.es/egob/catalogo/212531-10515086-calidad-aire-tiempo-real.csv',
        headers: {'User-Agent': 'node.js',
                  'Accept': 'text/csv'}
    };
    return new Promise(function(resolve, reject) 
    {
        // Do async job
        request.get(options, function(err, resp, body) 
        {
            if (err) 
            {
                reject(err);
            } 
            else 
            {
                console.log("Actualizando datos en tiempo real");
                var csvFile = body;
                csv({"delimiter": ";"})
                .fromString(csvFile)
                .then(function(jsonArrayObj)
                { 
                    resolve(jsonArrayObj); 
                })
            }
        })
    });
}

function esNecesarioActualizarDatos()
{
    // Consultamos la hora de última actualización en la base de datos
    // Sqlite y actualizamos si ha pasado ya más de una hora
    return new Promise(function(resolve, reject) 
    {
        var resultado = obtenerHoraUltimaActualizacion();
        resultado.then(function(hora)
        {
            var diferenciaMilisegundos = Date.now() - Date.parse(hora);
            var milisegundosHora = 60 * 60 * 1000;
            if (diferenciaMilisegundos > milisegundosHora)
            {
                resolve(true);
            }
            else
            {
                resolve(false);
            }
        }, 
        function(err)
        {
            console.log(err);
            resolve(false);
        });
    });
}

function obtenerHoraUltimaActualizacion()
{
    return new Promise(function(resolve, reject) 
    {
        var consulta = "SELECT MAX(HORA_ACTUALIZACION) AS HORA_ACTUALIZACION" + 
                       "  FROM ACTUALIZACIONES";

        var resultado = ejecutarConsulta(consulta);

        resultado.then(function(rows)
        {
            resolve(rows[0].HORA_ACTUALIZACION);
        },
        function(err)
        {
            console.log(err);
            reject(null);
        });
    });
}

exports.obtenerDatosEstacion = function(id)
{
    return(new Promise(function(resolve, reject)
    {
        var resultado = esNecesarioActualizarDatos();
        resultado.then(function(esNecesarioActualizar)
        {
            if (esNecesarioActualizar)
            {
                var actualizacion = actualizarDatos();
                actualizacion.then(function()
                {

                },
                function(err)
                {

                });
                //resolve("Sí hay que actualizar");
            }
            else
            {
                //resolve("No hay que actualizar");
            }
        },
        function(err)
        {
            console.log(err);
        });    
    },
    function(err)
    {
        reject("Error consultando");
    }));
};

exports.obtenerEstaciones = function()
{
    return new Promise(function(resolve, reject) 
    {
        var consulta = "SELECT ID, CODIGO, CODIGO_ANTIGUO, NOMBRE, " +
                       "       FECHA_ALTA, FECHA_BAJA, FECHA_CAMBIO_CODIGO" + 
                       "  FROM ESTACIONES";

        var resultado = ejecutarConsulta(consulta);

        resultado.then(function(rows)
        {
            var estaciones = [];
            rows.forEach((row) => 
            {
                estaciones.push(new Estacion(row.ID, row.CODIGO, row.CODIGO_ANTIGUO,
                                            row.NOMBRE, 
                                            Date.parse(row.FECHA_ALTA), 
                                            Date.parse(row.FECHA_BAJA),
                                            Date.parse(row.FECHA_CAMBIO_CODIGO)));
            });    
            resolve(estaciones);    
        },
        function(err)
        {
            console.log(err);
            reject(null);
        });
    });

};
