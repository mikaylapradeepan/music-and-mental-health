var chart; 

data = d3.csv("./data/netflix_user_behavior_dataset.csv").then(function (data) {
    data.forEach(d => {
        d.age = +d.age;
        d.avg_watch_time_minutes = +d.avg_watch_time_minutes;
        d.watch_sessions_per_week = +d.watch_sessions_per_week;
        d.binge_watch_sessions = +d.binge_watch_sessions;
        d.recommendation_click_rate = +d.recommendation_click_rate;
        d.completion_rate = +d.completion_rate;
    });

    console.log("Data loaded")

    chart = new Chart("#chart-area", data);
    chart.updateVis();
}).catch(error => {
    console.error("Error loading CSV:", error);
});

document.getElementById('select-order-type').onchange = function () {
    if (chart) { 
        chart.updateVis(this.value);
    }
}