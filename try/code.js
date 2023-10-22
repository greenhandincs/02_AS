
var svg = d3.select("svg"),
    width = +svg.node().getBoundingClientRect().width,
    height = +svg.node().getBoundingClientRect().height;

// svg objects
var link, node;
// the data - an object with nodes and links
var graph;

// load the data
// miserables.json
d3.json("../data/sample1.json", function (error, _graph) {
    if (error) throw error;
    graph = _graph;
    let dataset = graph
    let getByNodeId = new Map()
    dataset.as_groups.forEach(as => {
        if (as.nodes) {
            as.nodes.forEach(node => {
                getByNodeId.set(node.id, as.as_id)
            })
        }
    })

    console.log(getByNodeId);

    // 将每个边对象转换为d3.js所需的格式            
    let edgesData = []
    dataset.edges.forEach(function (edge) {
        // let s = edge.source_id,
        //     t = edge.target_id
        let s = getByNodeId.get(edge.source_id),
            t = getByNodeId.get(edge.target_id)
        if (s !== t) {
            edgesData.push({
                source: s,
                target: t
            })
        }
    });
    graph.nodes = graph.as_groups
    graph.links = edgesData
    console.log(graph);
    initializeDisplay();
    initializeSimulation();
});



//////////// FORCE SIMULATION //////////// 

// force simulator
var simulation = d3.forceSimulation();

// set up the simulation and event to update locations after each tick
function initializeSimulation() {
    simulation.nodes(graph.nodes);
    initializeForces();
    simulation.on("tick", ticked);
}

// values for all forces
forceProperties = {
    center: {
        x: 0.5,
        y: 0.5
    },
    charge: {
        enabled: true,
        strength: -800,
        distanceMin: 100,
        distanceMax: 200
    },
    collide: {
        enabled: false,
        strength: 0.3,
        iterations: 1,
        radius: 12
    },
    forceX: {
        enabled: true,
        strength: .1,
        x: .5
    },
    forceY: {
        enabled: true,
        strength: .1,
        y: .5
    },
    link: {
        enabled: true,
        distance: 30,
        iterations: 1
    }
}

// add forces to the simulation
function initializeForces() {
    // add forces and associate each with a name
    simulation
        .force("link", d3.forceLink())
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide())
        .force("center", d3.forceCenter())
        .force("forceX", d3.forceX())
        .force("forceY", d3.forceY());
    // apply properties to each of the forces
    updateForces();
}

// apply new force properties
function updateForces() {
    // get each force by name and update the properties
    simulation.force("center")
        .x(width * forceProperties.center.x)
        .y(height * forceProperties.center.y);
    simulation.force("charge")
        .strength(forceProperties.charge.strength * forceProperties.charge.enabled)
        .distanceMin(forceProperties.charge.distanceMin)
        .distanceMax(forceProperties.charge.distanceMax);
    simulation.force("collide")
        .strength(forceProperties.collide.strength * forceProperties.collide.enabled)
        .radius(forceProperties.collide.radius)
        .iterations(forceProperties.collide.iterations);
    simulation.force("forceX")
        .strength(forceProperties.forceX.strength * forceProperties.forceX.enabled)
        .x(width * forceProperties.forceX.x);
    simulation.force("forceY")
        .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
        .y(height * forceProperties.forceY.y);
    simulation.force("link")
        .id(function (d) { return d.as_id; })
        .distance(forceProperties.link.distance)
        .iterations(forceProperties.link.iterations)
        .links(forceProperties.link.enabled ? graph.links : []);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    simulation.alpha(1).restart();
}



//////////// DISPLAY ////////////

// generate the svg objects and force simulation
function initializeDisplay() {
    let r = forceProperties.collide.radius
    // 在SVG中创建两个箭头标记
    svg.append("defs")
        .append("marker")
        .attr("id", "arrow-end")
        .attr("viewBox", "0 -3 6 6")
        .attr("refX", r + 6)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .attr("fill", "#aaa")
        .append("path")
        .attr("d", "M0,-3L6,0L0,3");

    svg.append("defs")
        .append("marker")
        .attr("id", "arrow-start")
        .attr("viewBox", "0 -3 6 6")
        .attr("refX", -r / 2)
        .attr("refY", 0)
        .attr("markerWidth", 4)
        .attr("markerHeight", 4)
        .attr("orient", "auto")
        .attr("fill", "blue")
        .append("path")
        .attr("d", "M6,-3L0,0L6,3");

    // set the data and properties of link lines
    link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .attr("marker-start", d => d["link_style"] == 3 ? "url(#arrow-start)" : "none")
        .attr("marker-end", "url(#arrow-end)");

    // set the data and properties of node circles
    node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("g")        
        .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    node.append("circle")

    // 在节点上添加文本元素
    node.append("text")
        .attr("fill", "#fff")
        .style('text-anchor', 'middle')
        .style("dominant-baseline", "middle")
        .style("font-size", "8px")
        .text(d => d.as_name)
    
    // node tooltip
    node.append("title")
        .text(function (d) { return d.as_id; });
    // visualize the graph
    updateDisplay();
}

// update the display based on the forces (but not positions)
function updateDisplay() {
    node.selectAll("circle")
        .attr("r", forceProperties.collide.radius)
        // .attr("stroke", forceProperties.charge.strength > 0 ? "black" : "white")
        // .attr("stroke-width", forceProperties.charge.enabled == false ? 0 : Math.abs(forceProperties.charge.strength) / 15);

    link
        .attr("stroke-width", forceProperties.link.enabled ? 1 : .5)
        .attr("opacity", forceProperties.link.enabled ? 1 : 0);
}

// update the display positions after each simulation tick
function ticked() {
    link
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    node
        .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

    // node
    //     .attr("cx", function (d) { return d.x; })
    //     .attr("cy", function (d) { return d.y; });    
    d3.select('#alpha_value').style('flex-basis', (simulation.alpha() * 100) + '%');
}



//////////// UI EVENTS ////////////

function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0.0001);
    d.fx = null;
    d.fy = null;
}

// update size-related forces
d3.select(window).on("resize", function () {
    width = +svg.node().getBoundingClientRect().width;
    height = +svg.node().getBoundingClientRect().height;
    updateForces();
});

// convenience function to update everything (run after UI input)
function updateAll() {
    updateForces();
    updateDisplay();
}