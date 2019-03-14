var mainColor = "#EF382F"
var minutesColor = "#EF382F"
var waterColor = "#0067b2"
var highlightColor = "#f4dc3e"
var intervals = [5,10,20]
var intervalMax = 60
var transportMode = "walking"   
var formattedKeys
var keysInUse
var geosByInterval = {}

setup()

function setup(error){//censusData,keys) {	
	if (error) throw error;
        
  //  formattedKeys = formatKeys(keys)
  //  keysInUse = keyModes
  //  
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
        
        d3.select("#controls").append("div")
        .attr("class","mode")
        .attr("id","walking")
        .html("walk")
        .on("click",function(){
            transportMode = "walking"
            d3.select("#walking").style("opacity",1)
            d3.select("#driving").style("opacity",.5)
            setUpEverything(map)
        })
        .attr("cursor","pointer")
        
        d3.select("#controls").append("div")
        .attr("class","mode")
        .attr("id","driving")
        .html("drive")
        .style("opacity",.5)
      //  .on("click",function(){
      //      d3.select("#walking").style("opacity",.7)
      //      d3.select("#driving").style("opacity",1)
      //      transportMode = "driving"
      //      setUpEverything(map)
      //  })
      //.attr("cursor","pointer")

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
    getIsochrone(map,intervals)        
}  

function drawMinutesBar(map){
   
    var width =120
    var height = 150
    var minuteBar = d3.select("#minutesBar").append("svg").attr("width",width).attr("height",height)
    var barWidth = 13
    var cornerRadius = barWidth/2
    var radius = barWidth*2
    var fontSize =15
    
    var minuteScale = d3.scaleLinear().domain([radius,height-radius]).range([intervalMax,5])
    
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
        .append("circle")
        .attr("class","sliderCircle")
        .attr("cx",width/4)
        .attr("cy",minuteScale.invert(intervals[2]))
        .attr("r",radius)
        .attr("fill",mainColor)
        .attr("cursor","pointer")
    
    minuteBar.append("text")
        .attr("class","sliderCircleLabel")
        .attr("x",width/4)
        .attr("text-anchor","middle")
        .attr("y",minuteScale.invert(intervals[2])+radius/4)
        .text(Math.round(intervals[2]))
        .attr("fill","#fff")
        .attr("font-weight","bold")
        .attr("cursor","pointer")
        .attr("font-size",fontSize)
        
    d3.select(".sliderCircleLabel")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );
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
                var sliderPosition = radius
            }else if(d3.event.y>height-radius){
                var sliderPosition = height-radius
            }else{
                var sliderPosition = d3.event.y
            }
            return sliderPosition
        }
        
        function dragged() {
          d3.select(".sliderCircle")
            .style("opacity",.7)
            .attr("cy", function(){
                var sliderPosition = getSliderPosition()
                d3.select(".sliderCircleLabel")
                .text(Math.round(minuteScale(sliderPosition)))
                .attr("y",sliderPosition+radius/4)
                .moveToFront()
                
                return sliderPosition
            });
        }

        function dragended() {
            d3.select(this).classed("active", false)
            d3.select(".sliderCircle").style("opacity",1)
            d3.select(".sliderCircleLabel").attr("fill","#fff");
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
                drawIsochrones(result,map,intervals)
                getCensusGeo(result,map,intervals)
}

function getIsochrone(map,intervals){
    var c = map.getCenter();
    var intervalString = intervals.toString()
    var Url = "https://api.mapbox.com/isochrone/v1/mapbox/"+transportMode+"/"+c.lng+","
    +c.lat+"?contours_minutes="+intervalString+"&polygons=true&access_token="+mapboxgl.accessToken
    $.ajax({
        url:Url,
        type:"GET",
        success:function(result){
           // console.log(temp)
                zoomToBounds(map,intervals,result,function(){
                    drawIsochrones(result,map,intervals,function(){
                        getCensusGeo(result,map,intervals)
                    })
                })
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
    getCensusFiles(geosByInterval[intervals[intervals.length-1]])
}

function getCensusFiles(geoids){
    var files = []
    for(var g in geoids){
        var fileName = "census_by_geo/"+geoids[g].replace("00000","000")+".json"
        var fileObject = d3.json(fileName)
        files.push(fileObject)
    }
   Promise.all(files)
    .then(function(data){
        onCensusLoaded(data)
    })
    //var q = queue();    
    //    for( var i in geoids){
    //        var filename = "census_by_geo/"+geoids[i].replace("00000","000")+".json"
    //        q = q.defer(d3.json, filename);
    //    }
    //    q.await(onCensusLoaded);
    //.await(onCensusLoaded);
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
        var contourLabelCircle = [mainColor,"#F7A9A9","#ffffff"]
        
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
                "circle-color":contourLabelCircle[l]
            }
        })
        
        var contourLabelText = ["#ffffff",mainColor,mainColor]
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
                "text-color":contourLabelText[l]
            }
        })
        
       
    }
        drawCenter(map)
    
}


