function searchXML(){
    const regex = new RegExp('\\.xml$');
    searchFiles(cordova.file.externalApplicationStorageDirectory + "Project/", regex, openFile);

}

function searchFiles(path, regex, succes){
    window.resolveLocalFileSystemURL(path,
        function (fileSystem) {
            var reader = fileSystem.createReader();
            reader.readEntries(
                function (entries) {
                    for(let entry of entries) {
                        if (regex.test(entry.name)) {
                            succes(entry.toInternalURL(), XMLparser)
                        }
                    }
                },
                function (err) {
                    console.log(err);
                }
            );
        }, function (err) {
            console.log(err);
        }
    );
}

function openFile(path, post_processing){
    window.resolveLocalFileSystemURL(path, function(file) {
        file.file(function (file) {
            var reader = new FileReader();
            reader.onloadend = function(evt){
                post_processing(this.result)
            }
            reader.readAsText(file, 'utf-8');
        })
    })
}

function XMLparser(xml){
    var doc = $.parseXML(xml)
    //var parser = new DOMParser()
    //var dom = parser.parseFromString(xml, "application/xml")
    //var name = dom.getElementsByTagName("id").item(0).textContent
    doc = $( doc )
    var name = doc.first("layerDb id").text()
    var source = new ol.source.Vector()
    getDataFromBD(name)

    let color_stroke = $(doc).find("Stroke CssParametr[name='stroke']").text()
    let width_stroke = $(doc).find("Stroke CssParametr[name='stroke-width']").text()
    let fill = new ol.style.Fill({color: $(doc).find("colorFill").text() })

    var layer = new ol.layer.Vector({
        source: source,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: color_stroke,
                width: width_stroke
            }),
            fill: fill
        })
    })
    layers[name] = layer
    map.addLayer(layer)
    console.log(name)
    function getDataFromBD(name){
        const query =  "SELECT id, pipe as name, AsText(Geometry) as geom, station,  date_insp as date from " + name
        var querySuccess = function (tx, res) {
            const format = new ol.format.WKT();
            for (let i = 0; i < res.rows.length; i++) {
                var wkt = res.rows.item(i).geom
                var feature = format.readFeature(wkt)
                feature.id = res.rows.item(i).id
                feature.name = res.rows.item(i).name
                feature.station = res.rows.item(i).station
                if (typeof res.rows.item(i).date === 'undefined') {
                    feature.date_insp = "None"
                } else {
                    feature.date_insp = new Date(res.rows.item(i).date)
                }
                source.addFeature(feature)
                all_features.push(feature)
            }
        }
        var queryError = function () {
            console.log("error")
        }
        db.transaction(function (tx) {
            tx.executeSql(query, [], querySuccess, queryError);
        })
    }
}





