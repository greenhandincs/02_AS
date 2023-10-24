export default function (nodes, links) {

    let simulation,
        width = 1200,
        height = 1000,
        svgCenter = [width / 2, height / 2],
        svgScale = 'scale(0.5)',
        backCalculation = 80, // [1->100]
        adjustable = 1,
        adjustableTime = 5,
        adjustableStrength = 0.5;

    let nodeSize = 5,
        coreNodeSize = 7;

    let centreForce = 0.7,//0.5-1
        repulsiveForce = 50, //
        attractiveForce = 50; //40-100


    let inCluster = 45, // < attractiveForce
        bridgeL1 = 50, // = attractiveForce
        bridgeL2 = 55, // > attractiveForce
        betweenCluster = 55; // > attractiveForce

    let svg = d3.select("#layout").attr('transform', svgScale);
    let link, node;
    svg.attr("width", width);
    svg.attr("height", height);

    simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBodyReuse().strength(-repulsiveForce))
        .force("center", d3.forceCenter(svgCenter[0], svgCenter[1]))
        .force("collide", d3.forceCollide().radius(function (d, i) {
            //碰撞避免，相当于把节点当作有半径的圆，设置碰撞半径，度大的点碰撞半径大
            if (d["core"] == 1)
                return coreNodeSize;
            else {
                return nodeSize;
            }
        }).strength(1))
        .force("x", d3.forceX(svgCenter[0]).strength(centreForce * 0.1))
        .force("y", d3.forceY(svgCenter[1]).strength(centreForce * 0.1))
        .force("link", d3.forceLink(links).id(function (d) { return d.name; }).distance(function (d, i) {

            //簇内边
            if (d.source.Core == 1) {
                return incluster;
            }
            //桥内边
            if ((d.source.importantCore == 1 && d.target.importantBridge == 1) || (d.target.importantCore == 1 && d.source.importantBridge == 1))
                return bridgeL1;//一类桥内边
            if ((d.source.importantBridge == 1 && d.target.importantBridge == 1) || (d.source.importantBridge == 1 && d.target.importantBridge == 1))
                return bridgeL2;//二类桥内边 

            //原始簇间边
            // if (d.source.bridge == 1 && d.target.core == 1)
            //     return "yellow";
            // if (d.source.core == 1 && d.target.bridge == 1)
            //     return "yellow";
            // if (d.source.bridge == 1 && d.target.bridge == 1)
            //     return "blue";
            // if (d.source.core == 1 && d.target.core == 1)
            //     return "green";

            if (d.source.bridgeOne != [])
                return inCluster + 15;

            //当前簇间边
            if (d.edge_current > 0.005)
                return betweenCluster;

            return 50;
        }))
        .on("tick", ticked);

    //后台计算
    function firstUpdate() {
        while (simulation.alpha() > simulation.alphaMin() * backCalculation) {
            console.log("first")
            simulation.tick();
        }
    }

    function drawLayout() {
        //设置连边数据
        link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke-width", function (d) { return 1; })
            .attr("stroke", function (d, i) {
                return "#999";
            });

        //设置节点数据
        node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("r", function (d, i) {
                if (d["core"] == 1)
                    return coreNodeSize;
                else {
                    return nodeSize;
                }
            })
            .attr("fill", function (d, i) {
                return "#999";
            })
            .call(
                d3
                    .drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended)
            );
    }
    //执行第一轮迭代
    firstUpdate();
    drawLayout();

    if (adjustable == 1) {
        var tmp = 1;
        let func = function (elapsed) {
            if (elapsed > adjustableTime * 1000) {
                simulation.alphaTarget(0);
                console.log("stop");
                timer.stop();
            }
            if (tmp == 1) {
                simulation.alphaTarget(0.5).restart();
                tmp = 0;
            }

        }
        var timer = d3.timer(func);
    }

    function ticked() {
        link.attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

        node.attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; });
    }

    function dragstarted(d) {

        if (!d3.event.active) {
            console.log("start");
            simulation.alphaTarget(0.3).restart();
        }
        d.fy = d.y;
        d.fx = d.x;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        console.log("ended")
        if (!d3.event.active) {
            simulation.alphaTarget(0);
        }
    }
}
