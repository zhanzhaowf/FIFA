// Creat range slider
$(function() {
	$("#year-slider").slider({
		range: true,
		min: 1930,
		max: 2014,
		values: [1930, 2014],
		slide: function(event, ui) {
			$("#year-range").val(ui.values[0] + " - " + ui.values[1]);
		}
	});
	$("#year-range").val($("#year-slider").slider("values", 0) +
		" - " + $("#year-slider").slider("values", 1));
});


// SVG drawing area

var margin = {top: 40, right: 40, bottom: 60, left: 60};

var width = 600 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;

var svg = d3.select("#chart-area").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Date parser (https://github.com/mbostock/d3/wiki/Time-Formatting)
var formatDate = d3.time.format("%Y");


// Initialize data
loadData();

// FIFA world cup
var data;

d3.select("#chart-data").on("change", updateVisualization);
d3.select("#year-filter").on("click", updateVisualization);


// Set transition duration
var dur = 800;


// Scale initialization
var xScale = d3.time.scale()
	.range([0, width]);

var yScale = d3.scale.linear()
	.range([height, 0]);


// Axis initialization
var xAxis = d3.svg.axis()
	.scale(xScale)
	.orient("bottom");

var yAxis = d3.svg.axis()
	.scale(yScale)
	.orient("left");

var xAxisGroup = svg.append("g")
	.attr("class", "axis")
	.attr("transform", "translate(0," + height + ")");

xAxisGroup.append("text")
		.attr("class", "axis-title")
		.attr("x", 0.5 * width)
		.attr("y", "3em")
		.style("text-anchor", "middle")
		.text("Year");

var yAxisGroup = svg.append("g")
	.attr("class", "axis");

var yAxisLabel = yAxisGroup.append("text")
	.attr("class", "axis-title")
	.attr("transform", "rotate(-90)")
	.attr("x", -0.5 * height)
	.attr("y", -50)
	.style("text-anchor", "middle");


// Initialize line chart
var lineFunction = d3.svg.line()
	.x(function(d) {
		return xScale(d.YEAR);
	})
	.interpolate("linear");

var lineGraph = svg.append("path")
	.attr("class", "line");


// Initialize tool-tip
var tip = d3.tip().attr("class", "d3-tip");
svg.call(tip);

// Initialize overlay circle group
var circleGroup = svg.append("g");


// Load CSV file
function loadData() {
	d3.csv("data/fifa-world-cup.csv", function(error, csv) {

		csv.forEach(function(d){
			// Convert string to 'date object'
			d.YEAR = formatDate.parse(d.YEAR);
			
			// Convert numeric values to 'numbers'
			d.TEAMS = +d.TEAMS;
			d.MATCHES = +d.MATCHES;
			d.GOALS = +d.GOALS;
			d.AVERAGE_GOALS = +d.AVERAGE_GOALS;
			d.AVERAGE_ATTENDANCE = +d.AVERAGE_ATTENDANCE;
		});

		// Sort the data in order
		csv.sort(function(a, b) {
			return a.YEAR - b.YEAR;
		});

		// Store csv data in global variable
		data = csv;

		// Draw the visualization for the first time
		updateVisualization();

		showEdition(data[data.length - 1]);
	});
}


// Render visualization
function updateVisualization() {
	//console.log(data);

	// Retrieve user input
	var selected = d3.select("#chart-data").property("value");
	var selectedText = $("#chart-data option:selected").text();
	var minYear = formatDate.parse($("#year-slider").slider("values", 0).toString());
	var maxYear = formatDate.parse($("#year-slider").slider("values", 1).toString());

	// Filter Data
	newdata = data.filter(function(d) {
		year = d.YEAR.getTime();
		return (year >= minYear.getTime() && year <= maxYear.getTime());
	})
	//console.log(newdata);

	// Reset scale and line functions
	xScale.domain([minYear, maxYear]).nice();
	yScale.domain([0, 1.1 * d3.max(newdata, function(d) {
		return d[selected];
	})]).nice();

	lineFunction.y(function(d) {
		return yScale(d[selected]);
	});

	// Redraw line graph
	lineGraph.transition().duration(dur)
		.attr("d", lineFunction(newdata));

	// Redraw axis
	xAxisGroup.transition().duration(dur).call(xAxis);
	yAxisGroup.transition().duration(dur).call(yAxis);
	yAxisLabel.text(selectedText);

	// Reset tip
	tip.html(function(d) {
		return "<div class='tooltip-title'><p>" + d.EDITION + "</p><p>" +
			selectedText + ": " + d3.format(",")(d[selected]) + "</p></div>";
	});

	// Redraw circles
	var circles = circleGroup.selectAll(".circle")
		.data(newdata, function(d) {
			return d.EDITION;
		});

	circles.exit()
		.transition().duration(dur)
		.attr("cx", function(d) {return xScale(d.YEAR);})
		.attr("cy", function(d) {return yScale(d[selected]);})
		.remove();

	circles.enter().append("circle")
		.attr("class", "circle")
		.attr("r", 5)
		.attr("cy", 0);

	circles.transition().duration(dur)
		.attr("cx", function(d) {return xScale(d.YEAR);})
		.attr("cy", function(d) {return yScale(d[selected]);});

	circles.on("mouseover", handleMouseOver)
		.on("mouseout", handleMouseOut)
		.on("click", showEdition);

}


// Creat Event Handlers for mouse
function handleMouseOver(d) {
	d3.select(this).transition().duration(dur/10)
		.attr("r", 10);

	tip.show(d);
}

function handleMouseOut(d) {
	d3.select(this).transition().duration(dur/10)
		.attr("r", 5);

	tip.hide(d);
}


// Show details for a specific FIFA World Cup
function showEdition(d){
	d3.select("#edition").text(d.EDITION);
	d3.select("#winner").text(d.WINNER);
	d3.select("#goals").text(d.GOALS);
	d3.select("#avg-goals").text(d.AVERAGE_GOALS);
	d3.select("#matches").text(d.MATCHES);
	d3.select("#teams").text(d.TEAMS);
	d3.select("#attendance").text(d3.format(",")(d.AVERAGE_ATTENDANCE));
}
