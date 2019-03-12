
var mainColor = "#000000"
d3.queue()
    //.defer(d3.csv, "R11901662_SL140.csv")
    .defer(d3.json, "keys.json")
    .defer(d3.json, "key_modes.json")
    .await(ready);

var intervals = [6,7,8]
var formattedKeys
var keysInUse
var geosByInterval = {}
var locations = [
    {"name":"Jackson_Heights","coordinates":[-73.891589, 40.746820]}
]

var lIndex = 0
var center = locations[lIndex].coordinates
var centerName = locations[lIndex].name

function ready(error, keys,keyModes){//censusData,keys) {	
	if (error) throw error;

    formattedKeys = formatKeys(keys)
    keysInUse = keyModes
    
    mapboxgl.accessToken = 'pk.eyJ1IjoiampqaWlhMTIzIiwiYSI6ImNpbDQ0Z2s1OTN1N3R1eWtzNTVrd29lMDIifQ.gSWjNbBSpIFzDXU2X5YCiQ';
    var map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/jjjiia123/cjt4m63s73st31gqijrm2r4b9',
        center: center, // starting position
        zoom: 13.5
       // maxZoom:15,
        //minZoom:10 // starting zoom
    });
    // Add geolocate control to the map
    //https://docs.mapbox.com/mapbox-gl-js/example/locate-user/
    
    map.on("load",function(){
        console.log(map.getStyle().layers)
        map.dragRotate.disable();
        map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        }));    
        getIsochrone(map,intervals)
        d3.select(".mapboxgl-ctrl-logo").remove()
        d3.select(".mapboxgl-ctrl-bottom-right").remove()
        d3.select("#info").html("areas(tracts) within "+intervals+" minute walks of here contain:")
    })
    //var geoLocate=d3.select(".mapboxgl-ctrl-geolocate").attr("aria-pressed")
        var locating 
   
   map.on("move",function(){
        locating = d3.select(".mapboxgl-ctrl-geolocate").attr("aria-pressed")
   })
    map.on("moveend",function(){
       
        if(locating == "true"){
            d3.select(".mapboxgl-ctrl-geolocate").attr("aria-pressed","false")
            locating = "false"
            setUpEverything()
        }
    })
   
    
    map.on("dragend",function(){
         setUpEverything()
        //d3.select(".mapboxgl-ctrl-geolocate").attr("aria-pressed",false)
    })
    
    
    
    function setUpEverything(){
       d3.selectAll(".dataColumn").remove()
        map.removeLayer("center")
        map.removeSource("center")
        for(var i in intervals){
            try{
                map.removeLayer("iso_"+intervals[i])
                map.removeLayer("iso_label_"+intervals[i])
                map.removeLayer("iso_outline_"+intervals[i])
                map.removeSource("iso_"+intervals[i])
                map.removeSource("iso_label_"+intervals[i])
                map.removeSource("iso_outline_"+intervals[i])
            }
            catch(err){
            }
        }
        getIsochrone(map,intervals)
    }
}

function getDirection(lat,lng){
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', function(event) {
                // console.log(event.alpha + ' : ' + event.beta + ' : ' + event.gamma);
                var direction = Math.round(event.alpha)
               console.log(direction)
            })
    }else{
        d3.select("#orientation").html("no orientation data from device")
        return undefined
    }
}


function zoomToBounds(map,intervals,result){
    //https://docs.mapbox.com/mapbox-gl-js/example/zoomto-linestring/
   // console.log(intervals[intervals.length-1])
    var outerIntervalIndex = 0//intervals.length-1
    var outerCoordinates = result.features[outerIntervalIndex].geometry.coordinates[0]
    var bounds = outerCoordinates.reduce(function(bounds, coord) {
        return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(outerCoordinates[0], outerCoordinates[0]));
    map.fitBounds(bounds,{padding:20})
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
function formatByInterval(data){    
    for(var i in geosByInterval){
        var intervalData = {}
        var geoids = geosByInterval[i]
        for(var g in geoids){
            var geoid = geoids[g].replace("00000","000")
            intervalData[geoid]=data[geoid]
        }
        //console.log(intervalData)
        formatData(intervalData,i)
    }
    var formattedByCode = formatForCharts(geosByInterval)
    drawCharts(formattedByCode)
}
function formatForCharts(data){
    var formattedByCode = {}
    for(var i in data){
        var intervalData = data[i].data
        for(k in intervalData){
            var key = k
            if(Object.keys(formattedByCode).indexOf(key)==-1){
                formattedByCode[k]=[]
                formattedByCode[k].push({interval:i, value:intervalData[k].value, percent:intervalData[k].percent,name:intervalData[k].name})
            }else{
                formattedByCode[k].push({interval:i, value:intervalData[k].value, percent:intervalData[k].percent,name:intervalData[k].name})
            }
        }
    }
    return formattedByCode
}
function drawCharts(data){
    for(var i in data){
        if(i.split("_")[2]!="001"){
            lineChart(i, data[i])
        }
    }
}
function lineChart(code, data){
    var w = 200
    var h = 100
    var svg = d3.select("#charts").append("svg").attr("width",w).attr("height",h)
    svg.append("text")
    .text(
        data[0].name
        .replace("Employed Civilian Population 16 Years and Over: ","")
        .replace("Total Population: ","")
        .replace("Population 5 Years and Over: ","")
    )
    .attr("x",10).attr("y",20)
    var line = d3.line()
        .x(function(d,i){
                return xScale(d.interval)
            
        })
        .y(function(d,i){
                return yScale(d.percent)
        })
            
    var yScale = d3.scaleLinear()
        .domain(d3.extent(data.map(function(item){
            return item.percent
        })))
        .range([h-20,20])
    var xScale = d3.scaleLinear().domain([0,data[data.length-1].interval]).range([0,w-20])
            
    svg.selectAll("circle")
        .data(data)
            .enter()
            .append("circle")
        .attr("class",code)
            .attr("cx",function(d){
                return xScale(d.interval)
            })
            .attr("cy",function(d){
                return yScale(d.percent)
            })
            .attr("r",3)
            .attr("fill",mainColor)
            
    svg.append("path")
        .data([data])
        .attr("d",line)
        .attr("fill", "none")
        .attr("stroke", mainColor)
    
    svg.selectAll(".labels")
        .data(data)
        .enter()
        .append("text")
        .text(function(d){
            return d.percent
        })
        .attr("x",function(d){
                return xScale(d.interval)-10
            })
        .attr("y",function(d){
            if(yScale(d.percent)>h/2){
                return yScale(d.percent)-5
            }else{
                return yScale(d.percent)+15
            }
                
        })
            
}
function formatData(data,interval){
    d3.select("#data").append("div").attr("class","dataColumn").attr("id","ring_"+interval)
    
    var formatted = {}
    
    var displayStr = "<strong>"+interval+" minutes and "+Object.keys(data).length+" tracts</strong><br>"
    
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
            formatted[f]["percent"]=percent
            displayStr=displayStr+ percent+"% "+ label[label.length-1]+"<br/>"
        }
    }
    geosByInterval[interval]["data"]=formatted
    d3.select("#ring_"+interval).html(displayStr)
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
           // console.log(temp)
            drawIsochrones(result,map,intervals)
            getCensusGeo(result,map,intervals)
            zoomToBounds(map,intervals,result)
        }
    })
}
function getCensusGeo(result, map,intervals){
    var censusGeos = []    
    map.setFilter("road-highlight",["!in","name",""])
    for(var i in result.features){
        var polygonBoundingBox = turf.bbox(result.features[i].geometry);
        var southWest = [polygonBoundingBox[0], polygonBoundingBox[1]];
                var northEast = [polygonBoundingBox[2], polygonBoundingBox[3]];
                var northEastPointPixel = map.project(northEast);
                var southWestPointPixel = map.project(southWest);
        var features = map.queryRenderedFeatures([southWestPointPixel, northEastPointPixel], { layers: ['road-highlight'] });
        var ids = []
        var interval = result.features[i].properties.contour
        geosByInterval[interval]=[]        
        features.forEach(function(geos){
            if(Object.keys(geosByInterval[interval]).indexOf(geos.properties["name"])==-1 && geos.properties["name"]!=undefined){
                geosByInterval[interval].push(geos.properties["name"])
            }
        })
        //censusGeos.push(ids)
    }
    var filter = ['in', 'name'].concat(geosByInterval[intervals[intervals.length-1]]);
    map.setFilter("road-highlight", filter);
 
//    var allGeos = []
//    for(var j in geosByInterval){
//        console.log(geosByInterval[j])
//        allGeos=allGeos.concat(geosByInterval[j])
//    }
//    console.log(allGeos)
    //getCensusFiles(geosByInterval[intervals[intervals.length-1]])
}

function getCensusFiles(geoids){
    var q = queue();    
        for( var i in geoids){
            var filename = "census_by_geo/"+geoids[i].replace("00000","000")+".json"
            q = q.defer(d3.json, filename);
        }
        q.await(onCensusLoaded);
    //.await(onCensusLoaded);
}


function onCensusLoaded(error){
 //   console.log(interval)
    var censusData = {}
    if(!error){
        for(var i =1; i < arguments.length;i++){
            var gid = arguments[i]["Geo_GEOID"]
            censusData[gid]=arguments[i]
        }
            formatByInterval(censusData)
        //formatData(censusData)
    }    
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
            "circle-radius": 5,
            "circle-color": "#000000"
              }
    })
    
}
function save_file(outfile,data)
{
    var blob = new Blob([data], {type: "text/plain;charset=utf-8"});
    saveAs(blob,outfile );
} 

function drawIsochrones(result,map,intervals){
    console.log(JSON.stringify(result))
    console.log(Object.keys(result))
   
   
 //  save_file()
    
   var opacity =[.8]// [.3,.5,.8]
    var width = [3]//[1,2,3]    
    var oScale = d3.scaleLinear().domain([0,intervals.length]).range([.7,1])
    var wScale = d3.scaleLinear().domain([0,intervals.length]).range([.5,2])
    var cScale = d3.scaleLinear().domain([0,intervals.length]).range(["yellow","green"])
    for(var l in intervals){
        var minutes = result.features[l].properties.contour
          
        var savedData = {
            "type":"FeatureCollection",
            "features":[
            {"type":"Feature",
                "properties":{"center":center, "minutes":minutes,"name":centerName},
            "geometry":
            result.features[l].geometry}
            ]
        }    
        var outFileName = centerName+"_"+minutes+".json"
        console.log(JSON.stringify(savedData))
        
        save_file(outFileName,JSON.stringify(savedData))
          
        map.addLayer({
            "id":"iso_"+minutes,
            "name":"iso_"+minutes,
            "type":"fill",//change this to line if outline is needed
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
                "fill-color":mainColor,
                //"fill-color":cScale(l),
                "fill-opacity":0.05
                //"line-color":"#d64b3b",
                //"line-width":wScale(l),
                //"line-opacity":oScale(l)
            }
        })
        map.addLayer({
            "id":"iso_outline_"+minutes,
            "name":"iso_outline_"+minutes,
            "type":"line",//change this to line if outline is needed
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
                "line-color":mainColor,
                "line-width":wScale(l),
                "line-opacity":oScale(l)
            }
        })
        //https://docs.mapbox.com/mapbox-gl-js/example/geojson-markers/
        map.addLayer({
            "id":"iso_label_"+minutes,
            "name":"iso_label_"+minutes,
            "type":"symbol",//change this to line if outline is needed
            "source":{
                "type":"geojson",
                "data":{
                    "type":"Feature",
                    "geometry":{
                        "type":"Point",
                        "coordinates":result.features[l].geometry.coordinates[0][0]
                    },
                    "properties":{
                        "title":minutes,
                    }
                }
               
            },
            "layout":{
                "text-field": "{title}",
                "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                "text-offset": [0, 0.2],
                "text-anchor": "top"
            },
            "paint":{
                "text-color":mainColor
            }
        })
    }
        drawCenter(map)
    
}


