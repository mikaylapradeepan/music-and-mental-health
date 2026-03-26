/*
 * Chart - Object constructor function
 */ 
Chart = function (_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data; 
    this.displayData = [];
    this.currentDemographic = "ageRange"; // Default view

    this.initVis();
};

Chart.prototype.initVis = function () {
    var vis = this;

    vis.margin = {top: 50, right: 150, bottom: 60, left: 80}; // Extra right margin for legend
    vis.width = 1000 - vis.margin.left - vis.margin.right;
    vis.height = 500 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select(vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Main X Scale (Demographic Groups like "18-25" or "Male")
    vis.x0 = d3.scaleBand()
        .range([0, vis.width])
        .padding(0.2);

    // Sub X Scale (Individual Genres within a group)
    vis.x1 = d3.scaleBand()
        .padding(0.05);

    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    // Color Scale for Genres
    vis.color = d3.scaleOrdinal(d3.schemeTableau10);

    // Axes
    vis.xAxis = d3.axisBottom(vis.x0);
    vis.yAxis = d3.axisLeft(vis.y);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    // Y-Axis Label
    vis.yLabel = vis.svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -vis.height / 2)
        .attr("text-anchor", "middle")
        .text("Number of Users");

    vis.wrangleData();
};

Chart.prototype.wrangleData = function (selectedDemographic) {
    let vis = this;

    // Keep track of which demographic we are looking at (ageRange, gender, or country)
    if (selectedDemographic) vis.currentDemographic = selectedDemographic;

    const getRange = (age) => {
        if (age <= 25) return "18-25";
        if (age <= 35) return "26-35";
        if (age <= 45) return "36-45";
        if (age <= 55) return "46-55";
        return "56+";
    };

    // 1. Pre-process to ensure all rows have the necessary keys
    let processedData = vis.data.map(d => ({
        ...d,
        ageRange: getRange(d.age),
        genre: d.favorite_genre
    }));

    // 2. Identify all unique Genres present in the data for the legend/sub-bars
    vis.allGenres = Array.from(new Set(processedData.map(d => d.genre))).sort();

    // 3. Group by the chosen demographic (e.g., "country")
    let groupedByDemo = d3.groups(processedData, d => d[vis.currentDemographic]);

    // 4. Map groups into a format where each object has counts for every genre
    vis.displayData = groupedByDemo.map(([demoValue, entries]) => {
        let genreCounts = { demoGroup: demoValue };
        
        // Initialize counts to 0
        vis.allGenres.forEach(g => genreCounts[g] = 0);
        
        // Populate counts
        entries.forEach(d => {
            genreCounts[d.genre] += 1;
        });
        
        return genreCounts;
    });

    // 5. Specific sorting for Age Ranges
    if (vis.currentDemographic === "ageRange") {
        const order = ["18-25", "26-35", "36-45", "46-55", "56+"];
        vis.displayData.sort((a, b) => order.indexOf(a.demoGroup) - order.indexOf(b.demoGroup));
    } else {
        vis.displayData.sort((a, b) => d3.ascending(a.demoGroup, b.demoGroup));
    }

    vis.updateVis();
};

Chart.prototype.updateVis = function () {
    let vis = this;

    // Update Domains
    vis.x0.domain(vis.displayData.map(d => d.demoGroup));
    vis.x1.domain(vis.allGenres).rangeRound([0, vis.x0.bandwidth()]);
    
    // Calculate Max Y based on the highest count of any single genre
    let maxY = d3.max(vis.displayData, d => d3.max(vis.allGenres, g => d[g]));
    vis.y.domain([0, maxY || 10]);

    // --- Data Binding for Groups ---
    let groups = vis.svg.selectAll(".demo-group")
        .data(vis.displayData, d => d.demoGroup);

    let groupsEnter = groups.enter().append("g")
        .attr("class", "demo-group");

    let groupsMerged = groupsEnter.merge(groups)
        .transition().duration(500)
        .attr("transform", d => `translate(${vis.x0(d.demoGroup)},0)`);

    // --- Data Binding for Bars (within each group) ---
    // We select "rect" within the merged groups
    let bars = vis.svg.selectAll(".demo-group").selectAll("rect")
        .data(d => vis.allGenres.map(genre => ({ key: genre, value: d[genre] })));

    bars.enter().append("rect")
        .attr("fill", d => vis.color(d.key))
        .merge(bars)
        .transition().duration(500)
        .attr("x", d => vis.x1(d.key))
        .attr("y", d => vis.y(d.value))
        .attr("width", vis.x1.bandwidth())
        .attr("height", d => vis.height - vis.y(d.value));

    bars.exit().remove();
    groups.exit().remove();

    // Update Axes
    vis.svg.select(".x-axis").transition().duration(500).call(vis.xAxis);
    vis.svg.select(".y-axis").transition().duration(500).call(vis.yAxis);

    // Optional: Update Legend (Simple implementation)
    this.drawLegend();
};

Chart.prototype.drawLegend = function() {
    let vis = this;
    vis.svg.selectAll(".legend").remove();

    let legend = vis.svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${vis.width + 20}, 0)`);

    vis.allGenres.forEach((genre, i) => {
        let legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);
        
        legendRow.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", vis.color(genre));

        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .style("text-transform", "capitalize")
            .text(genre);
    });
};