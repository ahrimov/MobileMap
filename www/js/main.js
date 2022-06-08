document.addEventListener('deviceready', onDeviceReady, false);
var vectorSource = new ol.source.Vector()

var all_features = []


var map;

function onDeviceReady() {
  console.log('ready')

  
  //copyDatabaseFile("sample.db").then(function () {
    var db = window.sqlitePlugin.openDatabase({path:cordova.file.applicationStorageDirectory + "app_database/sample.db", name:"sample"})
    var query = "SELECT id, pipe as name" + //
    " , AsText(Geometry)" + //
    " as geom from кран";
    var querySuccess = function(tx, res){
      const format = new ol.format.WKT();
      for(let i = 0; i < res.rows.length; i++){
        var wkt = res.rows.item(i).geom
        feature = format.readFeature(wkt)
        feature.id = res.rows.item(i).id
        feature.name = res.rows.item(i).name
          
        vectorSource.addFeature(feature)
        all_features.push(feature)

        
      }
    }
    var queryError = function(){console.log("error")}
    db.transaction(function(tx) {
        tx.executeSql(query, [], querySuccess, queryError);
    })


//})



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
    $('#infoFeature').css({'visibility': 'visible'})
    $('#infoFeature .point_id td').text(feature.id)
    $('#infoFeature .name td').text(feature.name)
    $('#infoFeature .desc td').text(feature.get('desc'))
    let featureCoords = feature.getGeometry().getCoordinates();
    let coord = []
    coord.push(featureCoords[0])
    //const projWidth = ol.extent.getWidth(map.getView().getProjection().getExtent());  
    //const worldsAway = Math.round(e.coordinate[0] / projWidth);  
    //featureCoords[0] = featureCoords[0] + worldsAway * projWidth;  
    //popup.setPosition(featureCoords);   
    console.log(map.getView().getCenter())
    console.log(coord)
    map.setView(new ol.View({
      center: featureCoords,
      zoom: 8,
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
