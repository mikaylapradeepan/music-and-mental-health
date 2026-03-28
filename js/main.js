let chart;

d3.csv("data/music_mental_health.csv").then(data => {
    data.forEach(d => {
        d["Hours per day"] = +d["Hours per day"];
        d["Anxiety"] = +d["Anxiety"];
        d["Insomnia"] = +d["Insomnia"];
        d["Depression"] = +d["Depression"];
        d["OCD"] = +d["OCD"];
    });

    chart = new Chart("#chart-area", data);
}).catch(error => console.error("Error loading CSV:", error));

function updateChart() {
    // Get values from the two dropdowns that actually exist in your HTML
    const metric = document.getElementById("select-metric").value;
    const instrumentalist = document.getElementById("select-instrumentalist").value;
    
    // Pass both to wrangleData
    chart.wrangleData(metric, instrumentalist);
}

// Attach listeners
document.getElementById("select-metric").onchange = updateChart;
document.getElementById("select-instrumentalist").onchange = updateChart;