var mymap;

function initmap()
{
    var initialLocation = [40.445, -3.661];

    mymap = L.map('mapid').setView(initialLocation, 12);
    mymap.on('click', onMapClick);
    
    /*
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', 
    {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'your.mapbox.access.token'
    }).addTo(mymap);
    */

    layer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), {
    attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
    minZoom: 0
    });

    layer.addTo(mymap);

    /*
    estaciones.forEach(estacion => {
        var marker = L.marker([estacion.LATITUD, estacion.LONGITUD]).addTo(mymap);
        var popup = L.popup();
        popup.setContent("Estación " + estacion.ALTITUD)
        //popup.openOn(mymap);
        marker.bindPopup(popup); 
        
    });
    */

    var estilo1 = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    var estilo2 = {
        radius: 8,
        fillColor: "#7800ff",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    obtenerEstaciones('/data/estaciones.json').then((estaciones) => 
    {
        // succesMessage es lo que sea que pasamos en la función resolve(...) de arriba.
        // No tiene por qué ser un string, pero si solo es un mensaje de éxito, probablemente lo sea.
        //console.log("¡Sí! " + successMessage);

        capaEstaciones = L.geoJSON(estaciones, {
            pointToLayer: function (feature, latlng) {
                //return L.circleMarker(latlng, geojsonMarkerOptions);
                return L.circleMarker(latlng);
            },
            style: function(feature) {
                /*switch (feature.properties.numero) {
                    case 'Republican': return {color: "#ff0000"};
                    case 'Democrat':   return {color: "#0000ff"};
                }*/
                if (feature.properties.numero < 50)
                {
                    return(estilo1);
                }
                else
                {
                    return(estilo2);
                }
            },
            onEachFeature: function(feature, layer) {
                /*
                if (feature.properties && feature.properties.popupContent) {
                    layer.bindPopup(feature.properties.popupContent);
                }
                */
                var popupContent = "Estación: " + feature.properties.numero;
                layer.bindPopup(popupContent);
            }
        }).addTo(mymap);

        mymap.fitBounds(capaEstaciones.getBounds());
    },
    (error) =>
    {
        alert(error);
    });
}


function onMapClick(e) 
{
    var popup = L.popup();

    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(mymap);
}

function obtenerEstaciones(rutaFichero)
{
    let peticionEstaciones = new Promise((resolve, reject) => 
    {
        var request = new XMLHttpRequest();
        request.open('GET', rutaFichero, true);
    
        request.onload = function() 
        {
            if (request.status >= 200 && request.status < 400) 
            {
                var data = JSON.parse(request.responseText);
                resolve(data);
            } 
            else 
            {
                reject("Error cargando fichero de estaciones");
            }
        };
    
        request.onerror = function() 
        {
            reject("Error cargando fichero de estaciones");
        };
    
        request.send();
    });

    return(peticionEstaciones);
}