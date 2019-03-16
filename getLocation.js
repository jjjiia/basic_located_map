
var x = document.getElementById("demo");
var count =1

function getLocation() {
  if (navigator.geolocation) {
 //   navigator.geolocation.getCurrentPosition(showPosition);
    navigator.geolocation.watchPosition(showPosition);               
  } else { 
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}
var url = 'https://script.google.com/macros/s/AKfycbzNviIp8dQDEjgsyULnMB1rNZsdINdL-qWdR580aqGjet_yRgZ8/exec'

function showPosition(position) {
    count+=1
    var newDate = new Date();
    var time = newDate

  

    var lat = position.coords.latitude
    var lng = position.coords.longitude
    var entry = {lat:lat, lng:lng, time:time}
    
    var getIp = $.getJSON('https://geoip-db.com/json/')
             .done (function(location) {
                 entry["iplng"]=location.longitude
                 entry["iplat"]=location.latitude
                 entry["ip"]= location.IPv4
                 
                 var jqxhr = $.ajax({
                   url: url,
                   method: "GET",
                   dataType: "json",
                   data: entry
                 }).success(
                     function(response){
                         d3.select("#rows").html(response.result+" at row "+ response.row)
                     }
                 );
                 
                 var text = String(time)+"<br><br>"
                             +"Browser: Lat/Lng: " + position.coords.latitude +","+position.coords.longitude
                             +"<br/>"+"<br/>"                                       
                             +"IP Lat/Lng: "+entry["iplat"]+","+entry["iplng"]+"<br>"+"<br>"
                             +"IP address: "+entry["ip"];
                 d3.select("#data").html(text)
             });
}
getLocation()