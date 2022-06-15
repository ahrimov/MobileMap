document.addEventListener('deviceready', onDeviceReady, false);
var vectorSource = new ol.source.Vector()

var all_features = []

var map, db;

var layers = {}



function onDeviceReady() {
  console.log('ready')

  db = window.sqlitePlugin.openDatabase({
    path: cordova.file.applicationStorageDirectory + "app_database/full_sample.db",
    name: "sample"
  })

  drawCurrentPosition()

  parseDataFromDB()

  searchXML()





  //window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory + "json.json", gotFile, fail);
  var raster = new ol.layer.Tile({
    source: new ol.source.OSM({
           /* url: cordova.file.externalDataDirectory + 'Tiles/{z}/{x}/{y}.png',
            tileLoadFunction: function(imageTile, src){
              window.resolveLocalFileSystemURL(src, function success(fileEntry){
                imageTile.getImage().src = fileEntry.toInternalURL();
              })
            }*/
    })
  });



const vector = new ol.layer.Vector({
  source: vectorSource,
  style: new ol.style.Style({
    stroke: new  ol.style.Stroke({
      color: '#f51818',
      width: 2,
    }),
    image: new  ol.style.Circle({
      radius: 7,
      fill: new  ol.style.Fill({
        color: '#f51818',
      }),
    }),
  }),
  });

  map = new ol.Map({
    target: 'map-container',
    layers: [raster, vector],
    view: new ol.View({
      center: ol.proj.fromLonLat([55.4362, 58.7667]),
      zoom: 5,
      minZoom: 1,
      maxZoom: 9
    }),
  }); 
/*
  function createVectorSourceFromJson(filename){
    const json = JSON.parse(filename) 
    for (let line of json){
      var geojson = JSON.parse(line['st_asgeojson'])
      var point = new ol.geom.Point(geojson['coordinates'].reverse())
      point.transform('EPSG:4326', 'EPSG:3857');
      var featurePoint = new ol.Feature({
        geometry: point,
        id: line['point_id'],
        name: line['name'],
        desc: line['descr']
      });
      vectorSource.addFeature(featurePoint)
      all_features.push(featurePoint)
    }
  }
  
  
  function gotFile(file) {    
    file.file(function (file) {                
        var reader = new FileReader();
        reader.onloadend = function (evt) {          
            console.log('Open file is success');
            createVectorSourceFromJson(this.result)
        }
        reader.readAsText(file, 'utf-8');
             
    });            
  }
  
  function fail(e) {
    console.info("FileSystem Error : " + e);
  }

*/

  function parseDataFromDB() {
    var query = "SELECT id, pipe as name, AsText(Geometry) as geom, station,  date_insp as date from свеча";
    var querySuccess = function (tx, res) {
      const format = new ol.format.WKT();
      for (let i = 0; i < res.rows.length; i++) {
        var wkt = res.rows.item(i).geom
        feature = format.readFeature(wkt)
        feature.id = res.rows.item(i).id
        feature.name = res.rows.item(i).name
        feature.station = res.rows.item(i).station
        if (typeof res.rows.item(i).date === 'undefined') {
          feature.date_insp = "None"
        } else {
          feature.date_insp = new Date(res.rows.item(i).date)
        }
        vectorSource.addFeature(feature)
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

  document.getElementById("layers").addEventListener("click", changeLayers, false);
  var showLayer = true;
  function changeLayers(){
    showLayer = !showLayer;
    vector.setVisible(showLayer);
  }

  document.getElementById("list-button").addEventListener("click", showList, false);
  function showList(){
    $('#home').css({'display': 'none'})
    $('#list').css({'display': 'block'})
    line = ""
    for(let feature of all_features){
      line += `<tr onclick="listFeatureClick(`+ feature.id +`)"><td>` + feature.name + `</td></tr>`
    }
    $('#list .table').html(line)
  }


  document.getElementById("backHome").addEventListener("click", backHome, false);
  function backHome(){
    $('#list').css({'display': 'none'})
    $('#home').css({'display': 'block'})
  }


  document.getElementById("add-test-line").addEventListener("click", addTestLine, false);
  function addTestLine(){
    var query = "INSERT INTO свеча (id, lpu, station, date_insp) VALUES(200, 'Тестовые данные', 23222.1123, " + Date.now() + ")"
    var querySuccess = function(tx, res){
      console.log("Success add test line")
    }
    var queryError = function(){console.log("error")}
    db.transaction(function(tx) {
        tx.executeSql(query, [], querySuccess, queryError);
    })
  }

  document.getElementById("camera").addEventListener("click", openCamera, false);


  const displayModuleFeature = function (pixel) {
    const features = map.getFeaturesAtPixel(pixel)
    if(features.length == 1){
      displayFeatureInfo(features[0])
    }
    else if(features.length > 0 ){
      var line = ''
      for (let feature of features){
        line += `<tr onclick="moduleFeatureClick(`+ feature.id +`)"><td>` + feature.name + `</td></tr>`
        $('#manyFeature .table').html(line)
      }
      $('#manyFeature').modal('show');
    }
    else{
      displayFeatureInfo(null)
    }
  }

  map.on('click', function (evt) {
    displayModuleFeature(evt.pixel);
  });
}

function moduleFeatureClick(feature_id){
  const feature = findFeatureByID(all_features, feature_id)
  displayFeatureInfo(feature)
  $('#manyFeature').modal('hide');
}

function listFeatureClick(feature_id){
  $('#list').css({'display': 'none'})
  $('#home').css({'display': 'block'})
  const feature = findFeatureByID(all_features, feature_id)
  displayFeatureInfo(feature)
}

function displayFeatureInfo(feature){
  if(feature != null){
    $('#infoFeature').css({'display': 'block'})
    $('#infoFeature .point_id td').text(feature.id)
    $('#infoFeature .name td').text(feature.name)
    $('#infoFeature .station td').text(feature.station)
    $('#infoFeature .date_insp td').text(feature.date_insp)
    let featureCoords = feature.getGeometry().getCoordinates();
    var str = featureCoords.toString()
    var arr = str.split(',')
    map.setView(new ol.View({
      center: [parseInt(arr[0]),parseInt(arr[1])],
      zoom: 9,
      maxZoom: 9,
      minZoom: 5
  }));
  }
  else{
    $('#infoFeature').css('display: none;')
  }
}
 
function findFeatureByID(features, id){
  for(feature of features){
    if(feature.id == id){
      return feature
    }
  }
  return null
}
