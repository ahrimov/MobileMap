function drawCurrentPosition() {
    navigator.geolocation.watchPosition(onSuccess, onError);
    function onSuccess (position) {
        var point = new ol.geom.Point(ol.proj.fromLonLat([position.coords.longitude, position.coords.latitude]))
        var marker = new ol.Feature(point)
        marker.setStyle(new ol.style.Style({
            image: new  ol.style.Circle({
                radius: 7,
                fill: new  ol.style.Fill({
                    color: '#1870f5',
                }),
            })
        }))
        var gpsSource = new ol.source.Vector()
        gpsSource.addFeature(marker)
        var gpsLayer = new ol.layer.Vector({source: gpsSource})
        map.addLayer(gpsLayer)
        console.log('Latitude: '          + position.coords.latitude          + '\n' +
            'Longitude: '         + position.coords.longitude         + '\n' +
            'Altitude: '          + position.coords.altitude          + '\n');
    };

// onError Callback receives a PositionError object
//
    function onError(error) {
        alert('code: '    + error.code    + '\n' +
            'message: ' + error.message + '\n');
    }
}