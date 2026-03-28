Chart = function (_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data; 
    this.displayData = [];
    this.selectedMetric = "Anxiety"; 
    this.selectedInstrumentalist = "All";

    this.initVis();
};

Chart.prototype.initVis = function () {
    var vis = this;

    vis.margin = {top: 50, right: 50, bottom: 100, left: 80};
    vis.width = 900 - vis.margin.left - vis.margin.right;
    vis.height = 500 - vis.margin.top - vis.margin.bottom;

    // 1. Create the SVG base first
    vis.svg = d3.select(vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // 2. Now append grids (they will be at the bottom of the "sandwich")
    vis.xGrid = vis.svg.append("g").attr("class", "grid x-grid");
    vis.yGrid = vis.svg.append("g").attr("class", "grid y-grid");

    // 3. Tooltip remains on body
    vis.tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "solid 1px #ddd")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("pointer-events", "none");

    // Scales & Axes
    vis.x = d3.scaleBand().range([0, vis.width]).padding(0.3);
    vis.y = d3.scaleLinear().range([vis.height, 0]);
    vis.xAxis = d3.axisBottom(vis.x);
    vis.yAxis = d3.axisLeft(vis.y);

    vis.svg.append("g").attr("class", "x-axis axis").attr("transform", `translate(0,${vis.height})`);
    vis.svg.append("g").attr("class", "y-axis axis");

    // Labels
    vis.yLabel = vis.svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -vis.height / 2)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold");

    vis.xLabel = vis.svg.append("text")
        .attr("class", "x-label")
        .attr("y", vis.height + 85) 
        .attr("x", vis.width / 2)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Favourite Music Genre");

    this.wrangleData();
};

Chart.prototype.wrangleData = function (newMetric, newInstrumentalist) {
    let vis = this;

    if (newMetric) vis.selectedMetric = newMetric;
    if (newInstrumentalist) vis.selectedInstrumentalist = newInstrumentalist;

    // 1. Filter data based on Instrumentalist status
    let filteredData = vis.data;
    if (vis.selectedInstrumentalist !== "All") {
        filteredData = vis.data.filter(d => d.Instrumentalist === vis.selectedInstrumentalist);
    }

    // 2. Group by Genre and calculate averages
    let groupedData = d3.groups(filteredData, d => d["Fav genre"]);

    vis.displayData = groupedData.map(([genre, values]) => {
        return {
            genre: genre,
            avgScore: d3.mean(values, d => d[vis.selectedMetric]),
            count: values.length
        };
    }).filter(d => d.genre); // Remove undefined genres

    this.updateVis();
};

Chart.prototype.updateVis = function () {
    let vis = this;

    vis.x.domain(vis.displayData.map(d => d.genre));
    vis.y.domain([0, 10]);

    vis.yLabel.text("Average " + vis.selectedMetric + " Level");
    vis.xLabel.text("Music Genre");

    vis.yGrid.transition().duration(800)
        .call(d3.axisLeft(vis.y)
            .tickSize(-vis.width) // Make the ticks span the whole width
            .tickFormat("")       // Remove the labels (the real axis handles those)
        );

    let bars = vis.svg.selectAll(".bar")
        .data(vis.displayData, d => d.genre);

    bars.enter().append("rect")
        .attr("class", "bar")
        .attr("fill", "#0d6efd")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "#0a58ca");
            vis.tooltip.transition().duration(200).style("opacity", 1);
            vis.tooltip.html(`
                <strong>Genre:</strong> ${d.genre}<br>
                <strong>Avg ${vis.selectedMetric}:</strong> ${d.avgScore.toFixed(2)}<br>
                <strong>Sample Size:</strong> ${d.count} users
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", function(event) {
            vis.tooltip.style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "#0d6efd");
            vis.tooltip.transition().duration(500).style("opacity", 0);
        })
        .merge(bars)
        .transition().duration(800)
        .attr("x", d => vis.x(d.genre))
        .attr("y", d => vis.y(d.avgScore))
        .attr("width", vis.x.bandwidth())
        .attr("height", d => vis.height - vis.y(d.avgScore));

    bars.exit().remove();

    vis.svg.select(".x-axis").transition().duration(800).call(vis.xAxis)
        .selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");
    vis.svg.select(".y-axis").transition().duration(800).call(vis.yAxis);
};