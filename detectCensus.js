
var mainColor = "#EF382F"
var minutesColor = "#EF382F"
d3.queue()
    //.defer(d3.csv, "R11901662_SL140.csv")
    .defer(d3.json, "keys.json")
    .defer(d3.json, "key_modes.json")
    .await(ready);

var intervals = [2,5,30]
    
var formattedKeys
var keysInUse
var geosByInterval = {}
function ready(error, keys,keyModes){//censusData,keys) {	
	if (error) throw error;
    
    formattedKeys = formatKeys(keys)
    keysInUse = keyModes
    
    mapboxgl.accessToken = 'pk.eyJ1IjoiampqaWlhMTIzIiwiYSI6ImNpbDQ0Z2s1OTN1N3R1eWtzNTVrd29lMDIifQ.gSWjNbBSpIFzDXU2X5YCiQ';

    var map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/jjjiia123/cjnyr10u90wdz2rrrrzfplq2s',
        center: [-73.998617,40.728922], // starting position
        zoom: 13.5
       // maxZoom:15,
        //minZoom:10 // starting zoom
    });
    // Add geolocate control to the map
    //https://docs.mapbox.com/mapbox-gl-js/example/locate-user/
    
    map.on("load",function(){
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
        
         drawMinutesBar(map)
    })
    //var geoLocate=d3.select(".mapboxgl-ctrl-geolocate").attr("aria-pressed")
        var locating 
   
   map.on("move",function(){
        locating = d3.select(".mapboxgl-ctrl-geolocate").attr("aria-pressed")
   })
    map.on("moveend",function(){
            d3.select(".mapboxgl-ctrl-geolocate").attr("aria-pressed","false")
       
        if(locating == "true"){
            d3.select(".mapboxgl-ctrl-geolocate").attr("aria-pressed","false")
            locating = "false"
            setUpEverything(map)
        }
    })
   
    
    map.on("dragend",function(){
         setUpEverything(map)
        //d3.select(".mapboxgl-ctrl-geolocate").attr("aria-pressed",false)
    })
}
function setUpEverything(map){
   d3.selectAll(".dataColumn").remove()
    map.removeLayer("center")
    map.removeSource("center")
    var allLayers = map.getStyle().layers
    for(var l in allLayers){
        var currentLayer = allLayers[l].id
        if(currentLayer.split("_")[0]=="iso"){
            map.removeLayer(currentLayer)
            map.removeSource(currentLayer)
        }
    }
    
    //for(var i in intervals){
    //    try{
    //        map.removeLayer("iso_"+intervals[i])
    //        map.removeLayer("iso_label_"+intervals[i])
    //        map.removeLayer("iso_outline_"+intervals[i])
    //        map.removeLayer("iso_circle_"+intervals[i])
    //        map.removeSource("iso_"+intervals[i])
    //        map.removeSource("iso_label_"+intervals[i])
    //        map.removeSource("iso_outline_"+intervals[i])
    //        map.removeSource("iso_circle_"+intervals[i])
    //    }
    //    catch(err){
    //    }
    //}
    getIsochrone(map,intervals)        
}  

function drawMinutesBar(map){
   
    var width =120
    var height = 100
    var minuteBar = d3.select("#minutesBar").append("svg").attr("width",width).attr("height",height)
    var cornerRadius = 6
    var barWidth = 6
    var radius = barWidth*2
    
    var minuteScale = d3.scaleLinear().domain([radius+barWidth,height-radius-barWidth]).range([60,5])
    
    minuteBar
        .append("rect")
        .attr("rx", cornerRadius)
        .attr("ry", cornerRadius)
        .attr("x", width/4-barWidth/2)
        .attr("y", 0)
        .attr("width", barWidth)
        .attr("height", height)
        .attr("fill",mainColor)
   
    var slider = minuteBar//.selectAll(".slider")
        .append("rect")
        .attr("class","sliderCircle")
        .attr("x",width/4)
        .attr("y",height/2-radius)
        .attr("width",width/2)
        .attr("height",radius*2)
        .attr("fill",mainColor)
        .attr("rx", cornerRadius)
        .attr("ry", cornerRadius)
    
    minuteBar.append("text")
        .attr("class","sliderCircleLabel")
        .attr("x",width/4)
        .attr("y",height/2+radius/2)
        .text(Math.round(minuteScale(height/2)))
        .attr("fill","#fff")
        .attr("font-weight","bold")
        
    d3.select(".sliderCircle")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );
        
        d3.selection.prototype.moveToFront = function() {  
           return this.each(function(){
             this.parentNode.appendChild(this);
           });
         };
        
        function dragstarted() {
          d3.select(this).raise().classed("active", true);
        }
  
        function getSliderPosition(){
            if(d3.event.y<radius+barWidth){
                var sliderPosition = radius+barWidth
            }else if(d3.event.y>height-radius-barWidth){
                var sliderPosition = height-radius-barWidth
            }else{
                var sliderPosition = d3.event.y
            }
            return sliderPosition
        }
        
        function dragged() {
          d3.select(this)
            .attr("y", function(){
                
                var sliderPosition = getSliderPosition()
                d3.select(".sliderCircleLabel")
                .text(Math.round(minuteScale(sliderPosition))+" minutes")
                .attr("y",sliderPosition+radius/2)
                .moveToFront()
                
                return sliderPosition
            });
        }

        function dragended() {
          d3.select(this).classed("active", false);
          var sliderPosition = getSliderPosition()
          var sliderMinutes = minuteScale(sliderPosition)
          
          intervals = [Math.round(sliderMinutes/4),Math.round(sliderMinutes/2),Math.round(sliderMinutes)]
          setUpEverything(map)
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
    map.fitBounds(bounds,{padding:40})
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
    var populations = data["SE_T001_001"]
    var displayText = ""
    for(var p in populations){
        if(p==0){
            displayText+=populations[p]["value"]+" people live in the census tracts within a "+populations[p]["interval"]+" min walk of here, "
        }else if(p==populations.length-1){
            displayText+=" and "+populations[p]["value"]+" within "+populations[p]["interval"]+" minutes."
        }else{
            displayText+=populations[p]["value"]+" within "+populations[p]["interval"]+" minutes, "
        }
    }
    d3.select("#info").html(displayText)
    
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
    geosByInterval = {}
    for(var i in result.features){
        var polygonBoundingBox = turf.bbox(result.features[i].geometry);
        var southWest = [polygonBoundingBox[0], polygonBoundingBox[1]];
                var northEast = [polygonBoundingBox[2], polygonBoundingBox[3]];
                var northEastPointPixel = map.project(northEast);
                var southWestPointPixel = map.project(southWest);
        var features = map.queryRenderedFeatures([southWestPointPixel, northEastPointPixel], { layers: ['tracts'] });
        var ids = []
        var interval = result.features[i].properties.contour
        geosByInterval[interval]=[]
        
        features.forEach(function(geos){
            if(Object.keys(geosByInterval[interval]).indexOf(geos.properties.AFFGEOID)==-1){
                geosByInterval[interval].push(geos.properties.AFFGEOID)
            }
        })
        //censusGeos.push(ids)
    }
    var filter = ['in', 'AFFGEOID'].concat(geosByInterval[intervals[intervals.length-1]]);
    map.setFilter("tracts_highlight", filter);
 
//    var allGeos = []
//    for(var j in geosByInterval){
//        console.log(geosByInterval[j])
//        allGeos=allGeos.concat(geosByInterval[j])
//    }
//    console.log(allGeos)
    getCensusFiles(geosByInterval[intervals[intervals.length-1]])
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
function drawIsochrones(result,map,intervals){
   var opacity =[.8]// [.3,.5,.8]
    var width = [3]//[1,2,3]    
    var oScale = d3.scaleLinear().domain([0,intervals.length]).range([.7,1])
    var wScale = d3.scaleLinear().domain([0,intervals.length]).range([1,3])
    var cScale = d3.scaleLinear().domain([0,intervals.length]).range(["yellow","green"])
    for(var l in intervals){     
        map.addLayer({
            "id":"iso_"+result.features[l].properties.contour,
            "name":"iso_"+result.features[l].properties.contour,
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
                "fill-opacity":.1
                //"line-color":"#d64b3b",
                //"line-width":wScale(l),
                //"line-opacity":oScale(l)
            }
        })
        map.addLayer({
            "id":"iso_outline_"+result.features[l].properties.contour,
            "name":"iso_outline_"+result.features[l].properties.contour,
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
            "id":"iso_circle_"+result.features[l].properties.contour,
            "name":"iso_circle_"+result.features[l].properties.contour,
            "type":"circle",//change this to line if outline is needed
            "source":{
                "type":"geojson",
                "data":{
                    "type":"Feature",
                    "geometry":{
                        "type":"Point",
                        "coordinates":result.features[l].geometry.coordinates[0][0]
                    },
                    "properties":{
                        "title":result.features[l].properties.contour,
                    }
                }
               
            },
            "paint":{
                "circle-radius":12,
                "circle-color":mainColor
            }
        })
        map.addLayer({
            "id":"iso_label_"+result.features[l].properties.contour,
            "name":"iso_label_"+result.features[l].properties.contour,
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
                        "title":result.features[l].properties.contour,
                    }
                }
               
            },
            "layout":{
                "text-field": "{title}",
                "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                "text-offset": [0, -.6],
                "text-anchor": "top",
                "text-size":11
            },
            "paint":{
                "text-color":"#ffffff"
            }
        })
        
       
    }
        drawCenter(map)
    
}


