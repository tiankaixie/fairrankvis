import React from "react";
import * as d3 from "d3";
import { connect } from "react-redux";

const mapStateToProps = state => {
    return {
        modelName: state.modelName,
        individualSim: state.individualSim,
        input: state.input,
        output: state.output,
        clusterList: state.ui.clusterList,
        attributeList: state.ui.attributeList,
        clusterSliderUI: state.ui.clusterSliderUI,
        brushSelectedCluster: state.brushSelectedCluster
    };
};

class rankMappingView extends React.Component {
    constructor(props) {
        super(props);
        this.container = React.createRef();
    }

    componentDidMount() {
        this.initializeCanvas();
    }

    shouldComponentUpdate(nextProps) {
        return false;
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.updateCanvas(nextProps);
    }

    drawRankingResult() {}

    clusterHelper(nodeRankingScores, nodes, nodeItemSetIDMap, k, threshold) {
        // console.log(k + "means!!!");
        const nodeClusterMap = {};
        const nodeItemSetSet = new Set();
        let clusterMaker = require("clusters");
        let clusterNumber = k;
        clusterMaker.k(clusterNumber);
        clusterMaker.iterations(750);
        clusterMaker.data(nodeRankingScores);
        let nodeIter = 0;
        // console.log(clusterMaker.clusters());
        const preClusters = clusterMaker.clusters().map(item => item["points"]);
        for (const preCluster of preClusters) {
            const [minV, maxV] = d3.extent(preCluster);
            // console.log(maxV - minV);
            if (maxV - minV > threshold) {
                // console.log("over threshold");
                return null;
            }
        }
        const rankingScoreRange = [];
        let clusters = Object.values(clusterMaker.clusters()).map(
            (cluster, index) => {
                // console.log(cluster["points"]);
                rankingScoreRange.push(d3.extent(cluster["points"]));
                // console.log(cluster["points"].length);
                let count = 0;
                const clusterSet = [];
                while (count < cluster["points"].length) {
                    const nodeID = nodes[nodeIter];
                    nodeClusterMap[nodeID] = index;
                    nodeItemSetSet.add(nodeItemSetIDMap[nodeID]);
                    clusterSet.push({
                        nodeID: nodeID,
                        itemSetID: nodeItemSetIDMap[nodeID],
                        clusterID: index
                    });
                    nodeIter++;
                    count++;
                }
                return clusterSet;
            }
        );
        return {
            cluster: clusters,
            nodeItemSetSet: nodeItemSetSet,
            nodeClusterMap: nodeClusterMap,
            rankingScoreRange: rankingScoreRange
        };
    }

    clustering(nodeRankingScores, nodes, nodeItemSetIDMap, threshold) {
        let clusterRes;
        for (let k = 1; k <= 9; k++) {
            clusterRes = this.clusterHelper(
                nodeRankingScores,
                nodes,
                nodeItemSetIDMap,
                k,
                threshold
            );
            if (clusterRes !== null) {
                console.log("Got the right k=" + k);
                return clusterRes;
            }
        }
        return clusterRes;
    }

    renderSvg(props) {
        let {
            svgID,
            canvasHeight,
            input,
            output,
            attributeList,
            brushSelectedCluster,
            nodeColor,
            highlighNodeColor,
            similarityThreshold
        } = props;

        /***
         * Terminate rendering condition
         */
        if (brushSelectedCluster.size === 0) return;

        /***
         * Canvas setup
         */

        const width = this.container.current.getBoundingClientRect().width;
        const svgRoot = d3.select("#" + svgID);
        svgRoot.style("width", width);
        const svgBase = svgRoot.select("g");
        // const margin = { top: 50, right: 20, bottom: 20, left: 35 };
        const rectHeight = 25;
        const rectWidth = 25;
        /***
         *  Data processing: Target Model Nodes
         */
        const targetModelNodes = Object.keys(output["res"]).filter(item => {
            return brushSelectedCluster.has(String(item));
        });

        const height = Math.max(targetModelNodes.length * 15, canvasHeight);
        svgRoot.style("height", height);

        const dimensions = [...attributeList.selectedAttributes];
        const nodeItemSetIDMap = {};
        Object.keys(input.nodes).forEach(node => {
            let itemSetID = "";
            dimensions.forEach(d => {
                itemSetID += input["nodes"][node][d];
            });
            nodeItemSetIDMap[node] = itemSetID;
        });

        targetModelNodes.sort(
            (a, b) => output["res"][a]["rank"] - output["res"][b]["rank"]
        );

        const targetModelNodesRankingScores = targetModelNodes.map(item => [
            output["res"][item]["res"]
        ]);

        const targetClusteringRes = this.clustering(
            targetModelNodesRankingScores,
            targetModelNodes,
            nodeItemSetIDMap,
            similarityThreshold
        );
        const targetClusters = targetClusteringRes["cluster"];
        // const targetNodeItemSetSet = targetClusteringRes["nodeItemSetSet"];

        // console.log(targetClusters);
        // const targetNodeYScale = d3
        //     .scaleBand()
        //     .domain(targetClusters.map((item, i) => i))
        //     .range([margin.top, height - margin.bottom]);

        /***
         *  Data processing: Base Model Nodes
         */
        let baseModelNodes = Object.keys(
            input["topological_feature"]["pagerank"]
        );

        baseModelNodes.sort(
            (a, b) =>
                input["topological_feature"]["pagerank"][a]["rank"] -
                input["topological_feature"]["pagerank"][b]["rank"]
        );

        baseModelNodes = baseModelNodes.slice(
            output["res"][targetModelNodes[0]]["rank"] - 1,
            output["res"][targetModelNodes[targetModelNodes.length - 1]]["rank"]
        );

        const baseModelNodesRankingScores = baseModelNodes.map(item => [
            input["topological_feature"]["pagerank"][item]["score"]
        ]);

        const baseClustersRes = this.clustering(
            baseModelNodesRankingScores,
            baseModelNodes,
            nodeItemSetIDMap,
            similarityThreshold
        );

        const baseClusters = baseClustersRes["cluster"];
        // const baseNodeItemSetSet = baseClustersRes["nodeItemSetSet"];
        // console.log(baseClusters.length);

        const baseNodesSVG = svgBase
            .append("g")
            .attr("transform", "translate(125, 50)");
        const targetNodesSVG = svgBase
            .append("g")
            .attr("transform", "translate(500, 50)");

        /**
         * Start Drawing Base Clusters
         * */
        baseNodesSVG
            .append("text")
            .text("Base Model")
            .attr("x", 220)
            .attr("y", -20);

        targetNodesSVG
            .append("text")
            .text("Target Model")
            .attr("y", -20);

        let tempPrevH = 0;
        const baseClusterPositions = {};
        const baseClusterGroupSVG = baseNodesSVG
            .selectAll(".baseClusterGroup")
            .data(baseClusters)
            .enter()
            .append("g")
            .attr("class", "baseClusterGroup")
            .attr("id", (d, i) => "baseNodeCluster" + i)
            .attr("transform", (d, i) => {
                if (i === 0) {
                    return (
                        "translate(" +
                        (d.length >= 10
                            ? 0
                            : rectWidth * 10 - d.length * rectWidth) +
                        ", 0)"
                    );
                } else {
                    const level = Math.ceil(baseClusters[i - 1].length / 10);
                    const lastHeight = level * rectHeight;
                    tempPrevH += lastHeight;
                    baseClusterPositions[i - 1] = tempPrevH - lastHeight / 2;
                    if (i === baseClusters.length - 1) {
                        baseClusterPositions[i] =
                            tempPrevH +
                            (Math.ceil(baseClusters[i].length / 10) *
                                rectHeight) /
                                2;
                    }
                    return (
                        "translate(" +
                        (d.length >= 10
                            ? 0
                            : rectWidth * 10 - d.length * rectWidth) +
                        ", " +
                        tempPrevH +
                        ")"
                    );
                }
            });

        baseClusterGroupSVG
            .append("rect")
            .attr("class", "baseClusterBorder")
            .attr("id", (d, i) => "baseClusterBorder" + i)
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", d => {
                const level = Math.ceil(d.length / 10);
                return rectHeight * level;
            })
            .attr("width", d => Math.min(d.length, 10) * rectWidth)
            .attr("fill", "none")
            .attr("stroke", "black");

        baseClusterGroupSVG
            .selectAll(".baseRect")
            .data(d => d)
            .join("rect")
            .attr("id", d => "baseNode" + d["nodeID"])
            .attr("x", (d, i) => (i % 10) * rectWidth)
            .attr("y", (d, i) => Math.floor(i / 10) * rectHeight)
            .attr("height", rectHeight)
            .attr("width", d => rectWidth)
            .attr("stroke", "none")
            .attr("fill", d => nodeColor(d["itemSetID"]))
            .on("mouseover", (d, i) => {
                d3.select("#baseNode" + d["nodeID"])
                    .attr("stroke", "red")
                    .attr("stroke-width", 2);
                d3.select("#targetNode" + d["nodeID"])
                    .attr("stroke", "red")
                    .attr("stroke-width", 2);
                d3.select("#distrbase" + d["nodeID"])
                    .attr("stroke", "red")
                    .attr("stroke-width", 2);
                d3.select("#distrtarget" + d["nodeID"])
                    .attr("stroke", "red")
                    .attr("stroke-width", 2);
            })
            .on("mouseout", d => {
                d3.select("#baseNode" + d["nodeID"]).attr("stroke", "none");
                d3.select("#targetNode" + d["nodeID"]).attr("stroke", "none");
                d3.select("#distrbase" + d["nodeID"]).attr("stroke", "none");
                d3.select("#distrtarget" + d["nodeID"]).attr("stroke", "none");
            })
            .on("click", d => {
                d3.select("#baseClusterBorder" + d["clusterID"]).attr(
                    "stroke",
                    "red"
                );
                baseClusters[d["clusterID"]].forEach(item => {
                    d3.select("#targetNode" + item["nodeID"]).attr("fill", d =>
                        highlighNodeColor(d["itemSetID"])
                    );
                });
            })
            .on("dblclick", d => {
                d3.select("#baseClusterBorder" + d["clusterID"]).attr(
                    "stroke",
                    "black"
                );
                baseClusters[d["clusterID"]].forEach(item => {
                    d3.select("#targetNode" + item["nodeID"]).attr("fill", d =>
                        nodeColor(d["itemSetID"])
                    );
                });
            })
            .append("title")
            .text(
                (d, i) =>
                    "Node ID:" +
                    d["nodeID"] +
                    " Rank:" +
                    input["topological_feature"]["pagerank"][d["nodeID"]][
                        "rank"
                    ] +
                    "->" +
                    output["res"][d["nodeID"]]["rank"]
            );

        baseClusterGroupSVG
            .append("text")
            .attr(
                "x",
                // d => 10 * rectWidth - Math.min(d.length, 10) * rectWidth - 200
                d => -110
            )
            .attr("y", (d, i) => 15)
            .attr("class", "text-label")
            .text(
                (d, i) =>
                    baseClustersRes["rankingScoreRange"][i][0][0].toFixed(4) +
                    "~" +
                    baseClustersRes["rankingScoreRange"][i][1][0].toFixed(4)
            );

        /**
         * Target Cluster Drawing
         */
        tempPrevH = 0;
        const targetClusterPositions = {};
        const targetClusterGroupSVG = targetNodesSVG
            .selectAll(".targetClusterGroup")
            .data(targetClusters)
            .enter()
            .append("g")
            .attr("class", "targetClusterGroup")
            .attr("id", (d, i) => "targetNodeCluster" + i)
            .attr("transform", (d, i) => {
                if (i === 0) {
                    return "translate(0, 0)";
                } else {
                    const level = Math.ceil(targetClusters[i - 1].length / 10);
                    const lastHeight = level * rectHeight;

                    tempPrevH += lastHeight;
                    targetClusterPositions[i - 1] = tempPrevH - lastHeight / 2;
                    if (i === targetClusters.length - 1) {
                        targetClusterPositions[i] =
                            tempPrevH +
                            (Math.ceil(targetClusters[i].length / 10) *
                                rectHeight) /
                                2;
                    }
                    return "translate(0, " + tempPrevH + ")";
                }
            });

        targetClusterGroupSVG
            .append("rect")
            .attr("class", "targetClusterBorder")
            .attr("id", (d, i) => "targetClusterBorder" + i)
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", d => {
                const level = Math.ceil(d.length / 10);
                return rectHeight * level;
            })
            .attr("width", d => Math.min(d.length, 10) * rectWidth)
            .attr("fill", "none")
            .attr("stroke", "black");

        targetClusterGroupSVG
            .selectAll(".targetRect")
            .data(d => d)
            .join("rect")
            .attr("id", d => "targetNode" + d["nodeID"])
            .attr("x", (d, i) => (i % 10) * rectWidth)
            .attr("y", (d, i) => Math.floor(i / 10) * rectHeight)
            .attr("height", rectHeight)
            .attr("width", d => rectWidth)
            .attr("stroke", "none")
            .attr("fill", d => nodeColor(d["itemSetID"]))
            .on("mouseover", (d, i) => {
                d3.select("#baseNode" + d["nodeID"])
                    .attr("stroke", "red")
                    .attr("stroke-width", 2);
                d3.select("#targetNode" + d["nodeID"])
                    .attr("stroke", "red")
                    .attr("stroke-width", 2);
                d3.select("#distrbase" + d["nodeID"])
                    .attr("stroke", "red")
                    .attr("stroke-width", 2);
                d3.select("#distrtarget" + d["nodeID"])
                    .attr("stroke", "red")
                    .attr("stroke-width", 2);
            })
            .on("mouseout", d => {
                d3.select("#baseNode" + d["nodeID"]).attr("stroke", "none");
                d3.select("#targetNode" + d["nodeID"]).attr("stroke", "none");
                d3.select("#distrbase" + d["nodeID"]).attr("stroke", "none");
                d3.select("#distrtarget" + d["nodeID"]).attr("stroke", "none");
            })
            .on("click", d => {
                d3.select("#targetClusterBorder" + d["clusterID"]).attr(
                    "stroke",
                    "red"
                );
                targetClusters[d["clusterID"]].forEach(item => {
                    d3.select("#baseNode" + item["nodeID"]).attr("fill", d =>
                        highlighNodeColor(d["itemSetID"])
                    );
                });
            })
            .on("dblclick", d => {
                d3.select("#targetClusterBorder" + d["clusterID"]).attr(
                    "stroke",
                    "black"
                );
                targetClusters[d["clusterID"]].forEach(item => {
                    d3.select("#baseNode" + item["nodeID"]).attr("fill", d =>
                        nodeColor(d["itemSetID"])
                    );
                });
            })
            .append("title")
            .text(
                (d, i) =>
                    "Node ID:" +
                    d["nodeID"] +
                    " Rank:" +
                    input["topological_feature"]["pagerank"][d["nodeID"]][
                        "rank"
                    ] +
                    "->" +
                    output["res"][d["nodeID"]]["rank"]
            );

        // console.log(targetClusteringRes["rankingScoreRange"][0]);

        targetClusterGroupSVG
            .append("text")
            .attr("x", d => Math.min(d.length, 10) * rectWidth + 10)
            .attr("y", (d, i) => 15)
            .attr("class", "text-label")
            .text(
                (d, i) =>
                    targetClusteringRes["rankingScoreRange"][i][0][0].toFixed(
                        4
                    ) +
                    "~" +
                    targetClusteringRes["rankingScoreRange"][i][1][0].toFixed(4)
            );

        /****************************************************************************************
         *  Data processing: Links
         */
        console.log(baseClusterPositions);
        console.log(targetClusterPositions);
        const linkData = {};
        targetModelNodes.forEach(node => {
            if (
                baseClustersRes["nodeClusterMap"][node] !== undefined &&
                targetClusteringRes["nodeClusterMap"][node] !== undefined
            ) {
                const linkKey =
                    baseClustersRes["nodeClusterMap"][node] +
                    "-" +
                    targetClusteringRes["nodeClusterMap"][node];
                if (linkKey in linkData) {
                    linkData[linkKey]["count"]++;
                } else {
                    linkData[linkKey] = {
                        source:
                            baseClusterPositions[
                                baseClustersRes["nodeClusterMap"][node]
                            ],
                        target:
                            targetClusterPositions[
                                targetClusteringRes["nodeClusterMap"][node]
                            ],
                        count: 1
                    };
                }
            }
        });
        console.log(linkData);

        /***
         * Draw links
         */
        const linkSVG = svgBase
            .append("g")
            .attr("transform", "translate(300, 50)");

        linkSVG
            .selectAll("link")
            .data(Object.values(linkData))
            .join("line")
            .attr("x1", 75)
            .attr("x2", 200)
            .attr("y1", d => d["source"])
            .attr("y2", d => d["target"])
            .attr("stroke", "black")
            .attr("stroke-width", 1);
    }

    initializeCanvas() {
        this.renderSvg(this.props);
    }

    updateCanvas(props) {
        const { svgID } = props;
        const svgRoot = d3.select("#" + svgID);
        svgRoot.select("g").remove();
        svgRoot.append("g").attr("id", svgID + "-base");
        this.renderSvg(props);
    }

    render() {
        const { svgID, canvasHeight } = this.props;
        return (
            <div ref={this.container}>
                <svg id={svgID} height={canvasHeight}>
                    <g id={svgID + "-base"} height="100%" width="100%" />
                </svg>
            </div>
        );
    }
}

export default connect(mapStateToProps)(rankMappingView);
