

d3.queue()
    //.defer(d3.csv, "R11901662_SL140.csv")
    .defer(d3.json, "keys.json")
    .await(ready);

var intervals = [5,10,30]
    
var formattedKeys
var formattedCensus 
    
function ready(error, keys){//censusData,keys) {	
	if (error) throw error;
    formattedKeys = formatKeys(keys)
//    formattedCensus = formatData(censusData)
    
    mapboxgl.accessToken = 'pk.eyJ1IjoiampqaWlhMTIzIiwiYSI6ImNpbDQ0Z2s1OTN1N3R1eWtzNTVrd29lMDIifQ.gSWjNbBSpIFzDXU2X5YCiQ';

    var map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/jjjiia123/cjnyr10u90wdz2rrrrzfplq2s',
        center: [-73.998617,40.728922], // starting position
        zoom: 14 // starting zoom
    });
    makeKey()
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
        }
    }
    return formattedKeys
}
function formatData(data){
    var formatted = {}
    for(var d in data){
        var gid = data[d]["Geo_GEOID"]
        formatted[gid]=data[d]
    }
    return formatted
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
            var temp = result["features"][0]["geometry"]["coordinates"]+"<br/>"
            d3.select("#info").html(temp)
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
    d3.select("#key").html(censusGeos[0]+"<br/>"+censusGeos[1])
  //  map.setFilter("tracts_highlight", filter);
 //   getCensusData(censusGeos)
}
function getCensusData(geoids){
    geoids = geoids.sort(function(a,b) {
        return a.length - b.length;
    });
    var tractsCount = ""
    for(var g in geoids){
        var time = intervals[g]
        var tracts = geoids[g].length
        var countries = summarizeData(geoids[g])
        tractsCount+=tracts+" tracts within "+time+" minutes of walking, with"
        +" residents from more than <strong>"
        + countries.length+" countries</strong>"+"<br/><br/>"
    }
   d3.select("#info").html(tractsCount)
}

function summarizeData(tracts){
    //modes: reaverage, unique, percent each    
    
    var groupsInUse = ["T139"]
    for(var g in groupsInUse){
        var group = groupsInUse[g]
        var categories = Object.keys(formattedKeys[group])
        var unique = []
        for(var t in tracts){
            var tract = tracts[t].replace("00000","000")
            for(var c in categories){
                var key = formattedKeys[group][categories[c]]
                var value = parseInt(formattedCensus[tract][categories[c]])
                if(key.split(":").length==4 && value>0 && unique.indexOf(key.split(":")[3])==-1){
                    unique.push(key.split(":")[3])
                }
            }
        }
        return unique
    }
}

function makeKey(){
    
}
function drawCenter(map){
    
    var center = map.getCenter();
    var centerCoords = [center.lng,center.lat]
    map.addLayer({
        "id":"center",
        "name":"center",
        "type":"symbol",
        "source":{
            "type":"geojson",
            "data":{
                "type":"FeatureCollection",
                "features":[{
                    "type":"Feature",
                    "geometry":{
                        "type":"Point",
                        "coordinates":centerCoords,
                    },
                    "properties":{
                        "title":"center of the map",
                        "icon": "monument"
                    }
                }]
            }
        },
        "layout": {
                  "icon-image": "{icon}-15",
                  "text-field": "{title}",
                  "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                  "text-offset": [0, 0],
                  "text-anchor": "top"
              }
    })
    
}
function drawIsochrones(result,map,intervals){
    for(var l in intervals){
        map.addLayer({
            "id":"iso_"+intervals[l],
            "name":"iso_"+intervals[l],
            "type":"fill",
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
                "fill-color":"#000",
                "fill-opacity":.3
//                "line-color":"#000"
            }
        })
    }
}


