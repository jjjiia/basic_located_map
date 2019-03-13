function lineChart(code, data){
    console.log(data)
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


