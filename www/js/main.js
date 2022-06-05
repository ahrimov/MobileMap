//import { copyDatabaseFile } from "./openDB.js"

document.addEventListener('deviceready', onDeviceReady, false);

var all_features = []

function onDeviceReady() {
  console.log('ready')

  copyDatabaseFile("sample.db").then(function () {
    var db = sqlitePlugin.openDatabase("sample.db");
    db.readTransaction(function (txn){
      txn.executeSql('SELECT data FROM idx_свеча_GEOMETRY_node', [], function(tx, res){
        console.log('Successfully read from pre-populated DB:')
        console.log(JSON.stringify(res.rows.item(1)))
        //var data = res.rows.item(1).data
        /*var data = new Uint8Array([
          137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,8,0,0,
          0,8,8,2,0,0,0,75,109,41,220,0,0,0,34,73,68,65,84,8,215,99,120,
          173,168,135,21,49,0,241,255,15,90,104,8,33,129,83,7,97,163,136,
          214,129,93,2,43,2,0,181,31,90,179,225,252,176,37,0,0,0,0,73,69,
          78,68,174,66,96,130]);*/
        let blob = new Blob([data], {type: 'image/png'})
        var url = URL.createObjectURL(blob)
        var img = new Image()
        img.src = url
        console.log("data length: " + data.length);
        console.log("url: " + url);
        document.body.appendChild(img);
        //console.log(JSON.stringify(res.rows.item(0)))
      })
    })
  })



  window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory + "json.json", gotFile, fail);
  var raster = new ol.layer.Tile({
    source: new ol.source.OSM({
            url: cordova.file.externalDataDirectory + 'Tiles/{z}/{x}/{y}.png',
            tileLoadFunction: function(imageTile, src){
              window.resolveLocalFileSystemURL(src, function success(fileEntry){
                imageTile.getImage().src = fileEntry.toInternalURL();
              })
            }
    })
  });

var vectorSource = new ol.source.Vector()

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

  var map = new ol.Map({
    target: 'map-container',
    layers: [raster, vector],
    view: new ol.View({
      center: ol.proj.fromLonLat([55.4362, 58.7667]),
      zoom: 5,
      minZoom: 5,
      maxZoom: 9
    }),
  }); 

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


  document.getElementById("layers").addEventListener("click", changeLayers, false);
  var showLayer = true;
  function changeLayers(){
    showLayer = !showLayer;
    vector.setVisible(showLayer);
  }

  const displayModuleFeature = function (pixel) {
    const features = map.getFeaturesAtPixel(pixel)
    if(features.length == 1){
      displayFeatureInfo(features[0])
    }
    else if(features.length > 0 ){
      var line = ''
      for (let feature of features){
        line += `<tr onclick="moduleFeatureClick(`+ feature.get('id') +`)"><td>` + feature.get('name') + `</td></tr>`
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

function displayFeatureInfo(feature){
  if(feature != null){
    $('#infoFeature').css({'visibility': 'visible'})
    $('#infoFeature .point_id td').text(feature.get('id'))
    $('#infoFeature .name td').text(feature.get('name'))
    $('#infoFeature .desc td').text(feature.get('desc'))
  }
  else{
    $('#infoFeature').css('display: none;')
  }
}
 
function findFeatureByID(features, id){
  for(feature of features){
    if(feature.get('id') == id){
      return feature
    }
  }
  return null
}
