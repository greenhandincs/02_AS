
var svg = d3.select("svg"),
    width = +svg.node().getBoundingClientRect().width,
    height = +svg.node().getBoundingClientRect().height;

// svg objects
var link, node;
// the data - an object with nodes and links
var graph;
var hasLink = new Set();

// load the data
d3.json("../data/sample6.json").then(_graph => {
    graph = _graph;
    let dataset = graph,
        getByNodeId = new Map();
    dataset.as_groups.forEach(as => {
        if (as.nodes) {
            as.nodes.forEach(node => {
                getByNodeId.set(node.id, as.as_id)
            })
        }
    })
    console.log(getByNodeId);

    // 将每个边对象转换为d3.js所需的格式            
    let edgesData = [],
        degrees = {};
    dataset.edges.forEach(function (edge) {
        let s = getByNodeId.get(edge.source),
            t = getByNodeId.get(edge.target)
        let key = s + "," + t
        if (!hasLink.has(key)) {
            if (s !== t) {
                edgesData.push({
                    source: s,
                    target: t
                })
                degrees[s] = (degrees[s] || 0) + 1;
                degrees[t] = (degrees[t] || 0) + 1;
            }
            hasLink.add(key)
        }
    });
    const sortedNodes = Object.entries(degrees)
        .sort((a, b) => b[1] - a[1]);

    console.log(sortedNodes);
    graph.nodes = graph.as_groups
    graph.links = edgesData
    graph.nodes.forEach(node => {
        node.degree = degrees[node.as_id]
    })
    console.log(graph);
    initializeDisplay();
    initializeSimulation();
});
// d3.json("../data/sample6.json").then(_graph => {
//     graph = _graph;
//     let dataset = graph,
//         getByNodeId = new Map();
//     dataset.as_groups.forEach(as => {
//         if (as.nodes) {
//             as.nodes.forEach(node => {
//                 getByNodeId.set(node.id, as.as_id)
//             })
//         }
//     })
//     console.log(getByNodeId);

//     // 将每个边对象转换为d3.js所需的格式            
//     let edgesData = [],
//         degrees = {};
//     dataset.edges.forEach(function (edge) {
//         let s = getByNodeId.get(edge.source),
//             t = getByNodeId.get(edge.target)
//         let key = s + "," + t
//         if (!hasLink.has(key)) {
//             if (s !== t) {
//                 edgesData.push({
//                     source: s,
//                     target: t
//                 })
//                 degrees[s] = (degrees[s] || 0) + 1;
//                 degrees[t] = (degrees[t] || 0) + 1;
//             }
//             hasLink.add(key)
//         }
//     });
//     const sortedNodes = Object.entries(degrees)
//         .sort((a, b) => b[1] - a[1]);

//     console.log(sortedNodes);
//     graph.nodes = graph.as_groups
//     graph.links = edgesData
//     graph.nodes.forEach(node => {
//         node.degree = degrees[node.as_id]
//     })
//     console.log(graph);
//     initializeDisplay();
//     initializeSimulation();
// });



//////////// 力导引模拟 //////////// 

// 定义力导引模拟中可能用到的参数
forceProperties = {
    center: {
        x: 0.5,
        y: 0.5
    },
    charge: {
        enabled: true,
        strength: -8,
        distanceMin: 500,
        distanceMax: 800
    },
    collide: {
        enabled: true,
        strength: .1,
        iterations: 1,
        radius: 8
    },
    forceX: {
        enabled: true,
        strength: .02,
        x: .5
    },
    forceY: {
        enabled: true,
        strength: .01,
        y: .5
    },
    link: {
        enabled: true,
        distance: 40,
        iterations: 1
    }
}

// 定义力导引模拟
var simulation = d3.forceSimulation();

// 初始化力仿真
function initializeSimulation() {
    simulation.nodes(graph.nodes)
        .force("charge", d3.forceManyBody().strength(-20))
        // .force("link", d3.forceLink(graph.links).id(d => d.name).distance(40))
        .force("collide", d3.forceCollide().radius(8).strength(.2))
        .force("center", d3.forceCenter().x(width / 3).y(height / 2))
        .force("x", d3.forceX(width / 2).strength(forceProperties.forceX.strength))
        .force("y", d3.forceY(height / 2).strength(forceProperties.forceX.strength))
        .force("link", d3.forceLink(graph.links).id(d => d.as_id)
            .distance(d => {
                if (d.target.degree > 50 || d.source.degree > 50)
                    return 50
                else
                    return 30
            }))

    // simulation.alpha(0.7)
    simulation.velocityDecay(0.6);

    // updateForces();
    simulation.on("tick", ticked);
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
        .x(width / 2);
    simulation.force("forceY")
        .strength(forceProperties.forceY.strength * forceProperties.forceY.enabled)
        .y(height / 2);
    // simulation.force("link")
    //     .id(function (d) { return d.as_id; })
    //     .distance(forceProperties.link.distance)
    //     .iterations(forceProperties.link.iterations)
    //     .links(forceProperties.link.enabled ? graph.links : []);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    // simulation.alpha(1).restart();
}


// 初始化节点和边
function initializeDisplay() {

    // 添加连边
    link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")

    // 添加节点
    node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("g")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("click", highlightNode);
    node.append("circle")
        .attr("r", forceProperties.collide.radius);

    // 在节点上添加文本元素
    node.append("text")
        .attr("fill", "#2e65b5")
        .style('text-anchor', 'middle')
        .style("dominant-baseline", "middle")
        .style("font-size", "4px")
        .text(d => d.as_name);

    node.append("title")
        .text(function (d) { return d.as_id; });
 
}


function ticked() {
    link
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    node
        .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

}


// 设置交互效果
function highlightNode() {
    let selectedNode = d3.select(this),
        selectedId = selectedNode.select('circle').datum().as_id;
    // 再次点击，取消高亮，隐藏标签
    if (selectedNode.classed("selected")) {
        d3.select('#show').classed("hidden", true)        
        selectedNode.classed("selected", false);
        
        // link.classed("link-highlight", false)
        // link.classed("link-blur", false)
    } else {
        d3.select('#show').classed("hidden", false)
        node.classed("selected", false)
        d3.select(this).classed("selected", true);
                
        // 设置标签内容  
        let no = selectedNode.select('circle').datum()        
        d3.select('#info h3').text(no.as_name);
        d3.select('#info #asId').text(selectedId);
        d3.select('#info #innerNodes').text(no.nodes.length);
        d3.select('#info #inDegree').text(no.degree);
    }



}
function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.1).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0.0001);
    d.fx = null;
    d.fy = null;
}