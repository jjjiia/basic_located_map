           
           var x = document.getElementById("demo");
           
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
               var newDate = new Date();
               var time = newDate             
               var lat = position.coords.latitude
               var lng = position.coords.longitude
               var entry = {lat:lat, lng:lng, time:time}
               
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
                            
                            var text = String(time)+"Lat/Lng: " + position.coords.latitude +","+position.coords.longitude
                            d3.select("#location").html(text)
                            setup(position.coords.latitude,position.coords.longitude)
           }
           getLocation()
 