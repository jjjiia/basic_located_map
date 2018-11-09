

d3.queue()
    //.defer(d3.csv, "R11901662_SL140.csv")
    .defer(d3.json, "keys.json")
    .defer(d3.json, "key_modes.json")
    .await(ready);

var intervals = [5]
    
var formattedKeys
var keysInUse
    
function ready(error, keys,keyModes){//censusData,keys) {	
	if (error) throw error;
    
    formattedKeys = formatKeys(keys)
    keysInUse = keyModes
    
    mapboxgl.accessToken = 'pk.eyJ1IjoiampqaWlhMTIzIiwiYSI6ImNpbDQ0Z2s1OTN1N3R1eWtzNTVrd29lMDIifQ.gSWjNbBSpIFzDXU2X5YCiQ';

    var map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/jjjiia123/cjnyr10u90wdz2rrrrzfplq2s',
        center: [-73.998617,40.728922], // starting position
        zoom: 13.5 // starting zoom
    });
    // Add geolocate control to the map.

    map.on("load",function(){
        map.dragRotate.disable();
        map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        }));    
        getIsochrone(map,intervals)
        drawCenter(map)
    })
    
    map.on("moveend",function(){
        map.removeLayer("center")
        map.removeSource("center")
        for(var i in intervals){
            try{
                map.removeLayer("iso_"+intervals[i])
                map.removeSource("iso_"+intervals[i])
            }
            catch(err){
            
            }
        }
        getIsochrone(map,intervals)
        drawCenter(map)
    })
}
function formatKeys(keys){
    var formattedKeys = {}
    for(var k in keys){
        var key = k
        var value = keys[k]
        if(key[0]=="T" && key.split("_").length ==2){
            var group= key.split("_")[0]
            if(Object.keys(formattedKeys).indexOf(group)>-1){
                formattedKeys[group]["SE_"+key]=value
            }else{
                formattedKeys[group]={}
                formattedKeys[group]["SE_"+key]=value
            }
        }else if(key[0]=="C"){
            var group = key.slice(0,5)
            if(Object.keys(formattedKeys).indexOf(group)>-1){
                 formattedKeys[group][key]=value
            }else{
                formattedKeys[group]={}
                 formattedKeys[group][key]=value
            }
        }
    }
    return formattedKeys
}
function formatData(data){
    var formatted = {}
    var displayStr = ""
    for(var group in keysInUse){
        var mode = keysInUse[group]
        if(mode == "sum"){
            for(var key in formattedKeys[group]){
                var keyName = formattedKeys[group][key]
                var value = 0
                for(var d in data){
                   value += parseInt(data[d][key])
                }
                formatted[key]={"name":keyName,"value":value}
                //console.log([keyName,key,value])
            }
           
        }
    }
    for(var f in formatted){
        //console.log(f)
        if(f.slice(f.length-3,f.length)!="001"){
            var total = formatted[f.slice(0,f.length-3)+"001"].value
            var value = formatted[f].value
            var percent = Math.round(value/total*10000)/100
            var label = formatted[f].name.split(": ")
            
            displayStr=displayStr+ percent+"% "+ label[label.length-1]+"<br/>"
        }
    }
    d3.select("#key").html(displayStr)
}

function getIsochrone(map,intervals){
    var c = map.getCenter();
    var intervalString = intervals.toString()
    var Url = "https://api.mapbox.com/isochrone/v1/mapbox/walking/"+c.lng+","
    +c.lat+"?contours_minutes="+intervalString+"&polygons=true&access_token="+mapboxgl.accessToken
    $.ajax({
        url:Url,
        type:"GET",
        success:function(result){
           // console.log(temp)
            drawIsochrones(result,map,intervals)
            getCensusGeo(result,map,intervals)
        }
    })
}
function getCensusGeo(result, map,intervals){
    var censusGeos = []
    for(var i in result.features){
        var polygonBoundingBox = turf.bbox(result.features[i].geometry);
        var southWest = [polygonBoundingBox[0], polygonBoundingBox[1]];
                var northEast = [polygonBoundingBox[2], polygonBoundingBox[3]];
                var northEastPointPixel = map.project(northEast);
                var southWestPointPixel = map.project(southWest);
        var features = map.queryRenderedFeatures([southWestPointPixel, northEastPointPixel], { layers: ['tracts'] });
        var ids = []
        features.forEach(function(geos){
            ids.push(geos.properties.AFFGEOID)
        })
        censusGeos.push(ids)
    }
    var filter = ['in', 'AFFGEOID'].concat(censusGeos[0]);
 //   d3.select("#key").html(censusGeos[0]+"<br/>"+censusGeos[1])
    map.setFilter("tracts_highlight", filter);
    getCensusFiles(censusGeos)
//  console.log(formattedKeys)
}
function getCensusFiles(geoids){
    
    var q = queue();
    for( var i in geoids[0]){
        var filename = "census_by_geo/"+geoids[0][i].replace("00000","000")+".json"
        q = q.defer(d3.json, filename);
        
    }
    q.await(onCensusLoaded);
    
}
function onCensusLoaded(error){
    var censusData = {}
    if(!error){
        for(var i =1; i < arguments.length;i++){
            var gid = arguments[i]["Geo_GEOID"]
            censusData[gid]=arguments[i]
        }
    }
    //console.log(censusData)
    formatData(censusData)
}

function drawCenter(map){
    
    var center = map.getCenter();
    var centerCoords = [center.lng,center.lat]
    map.addLayer({
        "id":"center",
        "name":"center",
        "type":"circle",
        "source":{
            "type":"geojson",
            "data":{
                "type":"FeatureCollection",
                "features":[{
                    "type":"Feature",
                    "geometry":{
                        "type":"Point",
                        "coordinates":centerCoords,
                    }
                }]
            }
        },
        "paint": {
            "circle-radius": 10,
            "circle-color": "#cc5f43"
              }
    })
    
}
function drawIsochrones(result,map,intervals){
            
   var opacity =[.8]// [.3,.5,.8]
    var width = [3]//[1,2,3]
    for(var l in intervals){
           
        map.addLayer({
            "id":"iso_"+intervals[l],
            "name":"iso_"+intervals[l],
            "type":"line",
            "source":{
                "type":"geojson",
                "data":{
                    "type":"Feature",
                    "geometry":
                        result.features[l].geometry
                }
            },
            "layout":{},
            "paint":{
            //    "fill-color":"#000",
               // "fill-opacity":.3
                "line-color":"#d64b3b",
                "line-width":width[l],
                "line-opacity":opacity[l]
            }
        })
    }
}


