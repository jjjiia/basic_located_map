function onCensusLoaded(data){
    //format census data by geoid
    var censusData = {}
    for(var d in data){
        var geoid = data[d]["Geo_GEOID"]
        var geoData = data[d]
        censusData[geoid]=geoData
    }
    //group by interval
    formatByInterval(censusData)
    
    
}
function formatByInterval(data){  
    var intervalData = {}
    for(var i in geosByInterval){
        intervalData[i] = {}
        var geoids = geosByInterval[i]
        for(var g in geoids){
            var geoid = geoids[g].replace("00000","000")
            intervalData[i][geoid]=data[geoid]
        }
    }
    //console.log(intervalData)
    showTotalPopulation(intervalData)
    //for each interval
    //get group mode - make dictionary
    var groupedKeys = groupKeys(intervalData)
    var outerInterval = intervals[intervals.length-1]
    //get all group data
    for(var k in keyModes){
        var keyMode = keyModes[k].calculate
        var keyTitle = keyModes[k].title
        var keys = groupedKeys[k]
        if(keyMode == "sum" && keyTitle !="Total Population"){
            var sums = sumsForGroup(intervalData,keys)
            barChart(sums,k,outerInterval)
        }else if (keyMode == "unique"){
            var uniques = getUnique(intervalData,keys)
            var sums = sumsForGroup(intervalData,keys)
           // console.log(keys)
            var count = Object.keys(uniques).length
            barChart(uniques,k,outerInterval)
            
        }
    }
}
function getUnique(intervalData,keys){
    var uniques = {}
    for(var k in keys){
        if(keys[k][0]=="S"){
            var key = keys[k].replace("SE_","")
            var totalKey = keys[k].split("_")[0]+"_"+keys[k].split("_")[1]+"_001"
        }else{
             var key = keys[k]
            var totalKey = key.slice(0,key.length-3)+"001"
        }
        //console.log(key, totalKey)
        if(censusCodeToCategory[key]!=undefined && key != totalKey && censusCodeToCategory[key].split(":").length <3){
            uniques[keys[k]]={}
            for(var i in intervalData){
                var totalValue = getSum(intervalData[i],totalKey)
                var sum = getSum(intervalData[i],keys[k])
                var percent = Math.round(sum/totalValue*10000)/100
                
                uniques[keys[k]][i]={sum:sum, percent:percent}
            }
        }
    }
  return uniques
}
function groupKeys(intervalData){
    
    var firstInterval = Object.keys(intervalData)[0]
    var firstIntervalData = intervalData[firstInterval]
    var firstGeo = Object.keys(firstIntervalData)[0]
    var allKeys = Object.keys(firstIntervalData[firstGeo])
    var groupedKeys = {}
    for(var i in allKeys){
        var currentKey = allKeys[i]
        if(currentKey[0]=="S"){
            var currentKeyGroup = currentKey.split("_")[1]
         }else if(currentKey[0]=="C"){
            var currentKeyGroup = currentKey.slice(0,currentKey.length-3)
         }else{
            var currentKeyGroup = currentKey.split("_")[0]
         }
            if(Object.keys(keyModes).indexOf(currentKeyGroup)>-1){
                if(Object.keys(groupedKeys).indexOf(currentKeyGroup)==-1){
                    groupedKeys[currentKeyGroup]=[]
                    groupedKeys[currentKeyGroup].push(currentKey)
                }else{
                    groupedKeys[currentKeyGroup].push(currentKey)
                }
            }
    }
    return groupedKeys
}
function sumsForGroup(intervalData,keys){
    var sums = {}
    for(var k in keys){
        var key = keys[k]
        var totalKey = key.split("_")[0]+"_"+key.split("_")[1]+"_001"
        
        if(key != totalKey){
            sums[key] = {}
            for(var i in intervalData){
                var totalValue = getSum(intervalData[i],totalKey)
                var interval = i
                sums[key][interval]={}
                var sum = getSum(intervalData[i],keys[k])
                var percent = Math.round(sum/totalValue*10000)/100
            
                sums[key][interval]={sum:sum, percent:percent}
            }
        }
    }
    return sums
}
function showTotalPopulation(intervalData){
    var populations = []
    for(var i in intervalData){
        var interval = intervalData[i]
        var population = getSum(interval,"SE_T001_001")
        populations.push({interval:i,value:population})
    }  
    var displayText = ""
    for(var p in populations){
        var intervalPopulation = populations[p]["value"].toLocaleString()

        if(p==0){
            displayText+=intervalPopulation +" people live in the census tracts within "+populations[p]["interval"]+" min "
            +transportMode+" of here, "
        }else if(p==populations.length-1){
            displayText+=" and "+intervalPopulation +" within "+populations[p]["interval"]+" minutes."
        }else{
            displayText+=intervalPopulation +" within "+populations[p]["interval"]+" minutes, "
        }
    }
    d3.select("#info").html(displayText)
  //  var rScale = d3.scaleLinear().
  //      domain([0,maxPopulation*maxPopulation*Math.PI])
  // 
   
 //   circleChart(populations,rScale)
}
function barChart(data,group,interval){
    d3.select("#"+group).remove(0)
    var bars = Object.keys(data).length+1
    var w = window.innerWidth/2-20
    var barWidth = 30
    var h = barWidth*bars
    var padding = 10
    
    var max = d3.max(Object.keys(data), function(d) {
        return +data[d][interval].percent;} );
    
    var yScale = d3.scaleLinear().domain([0,max*1.3]).range([2,w-padding*4])
    var oScale = d3.scaleLinear().domain([0,max*1.3]).range([0,1])
    
    var barChartDiv = d3.select("#charts").append("div").attr("id",group).attr("class","barchart")
    
    d3.select("#"+group).append("div").html(keyModes[group].title+" <span class=\"percentShow\">%</span> <span class=\"valueShow\">#</span>").attr("class","barTitle")
        
    
    var svg = barChartDiv.append("svg").attr("width",w).attr("height",h)
    .attr("fill",waterColor)

    
    //svg.append("text").attr("class","chartTitle").text(keyModes[group].title+" % #").attr("x",padding).attr("y",padding)
    svg.selectAll("."+group)
        .data(Object.keys(data).sort())
        .enter()
        .append("rect")
        .attr("class", group)
        .attr("y",function(d,i){return i*barWidth})
        .attr("x",function(d,i){return 0})
        .attr("height",barWidth-barWidth/2)
        .attr("width",function(d,i){
            return yScale(data[d][interval].percent)
        })
        .attr("transform","translate("+padding+","+padding*2+")")
        .attr("fill",highlightColor)
        //.attr("opacity",function(d){
        //    return oScale(data[d][interval].percent)
        //})
        
    svg.selectAll(".label_percent ."+group)
        .data(Object.keys(data).sort())
        .enter()
        .append("text")
        .attr("class","label_percent "+group)
        .attr("y",function(d,i){return i*barWidth+barWidth/3})
        .attr("x",function(d,i){return yScale(data[d][interval].percent)+2})
        .attr("transform","translate("+padding+","+padding*2+")")
        .text(function(d,i){
           return data[d][interval].percent+"%"
        })
        .attr("fill",mainColor)
       
    svg.selectAll(".label_value ."+group)
        .data(Object.keys(data).sort())
        .enter()
        .append("text")
        .attr("class","label_value "+group)
        .attr("y",function(d,i){return i*barWidth+barWidth/3})
        .attr("x",function(d,i){return yScale(data[d][interval].percent)+2})
        .attr("transform","translate("+padding+","+padding*2+")")
        .text(function(d,i){
            return data[d][interval].sum
        })
        .attr("fill",mainColor)
        .attr("opacity",0)
          
    svg.selectAll(".label_"+group)
        .data(Object.keys(data).sort())
        .enter()
        .append("text")
        .attr("class","label_"+group)
        .attr("y",function(d,i){return i*barWidth-1})
        .attr("x",function(d,i){return 0})
        .attr("transform","translate("+padding+","+padding*2+")")
        .text(function(d,i){
                var labelList = censusCodeToCategory[d.replace("SE_","")].split(": ")                
           return labelList[labelList.length-1]
        })
        .attr("fill",waterColor)
       
    d3.selectAll(".percentShow")
        .style("color",mainColor)
        .on("click",function(){
            d3.selectAll(".valueShow").style("color",waterColor)
            d3.selectAll(".percentShow").style("color",mainColor)
            d3.selectAll(".label_percent").attr("opacity",1)
            d3.selectAll(".label_value").attr("opacity",0)
        }) 
    d3.selectAll(".valueShow")
        .style("color",waterColor)
        .on("click",function(){
            d3.selectAll(".valueShow").style("color",mainColor)
            d3.selectAll(".percentShow").style("color",waterColor)
            d3.selectAll(".label_percent").attr("opacity",0)
            d3.selectAll(".label_value").attr("opacity",1)
        }) 
}

function circleChart(data,scale){
    var w = 100
    var h = 100
    var padding = 20
    var svg = d3.select("#charts")
            .append("svg")
            .attr("width",w*3+padding)
            .attr("height",h+padding)
    
    var maxCircleArea = (w/2)*(w/2)*Math.PI
    
    scale.range([0,maxCircleArea])
    
    svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("class",function(d){return "interval_"+d.interval})  
    .attr("cx",function(d,i){
        return i*w+w/2
        return Math.sqrt(scale(d.population*d.population*Math.PI)/Math.PI)
    })
    .attr("cy",h/2)
    .attr("r",function(d){
        return Math.sqrt(scale(d.population*d.population*Math.PI)/Math.PI)
    })
    .attr("fill","none")
    .attr("stroke",mainColor)
}

function getSum(data,column){
    var sum = 0
    for(var i in data){
        var value = parseFloat(data[i][column])
        sum+=value
    }
    return sum
}
