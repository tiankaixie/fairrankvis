import React from "react";
import * as d3 from "d3";
import { connect } from "react-redux";
import { regularGreyDark, regularGreyStroke } from "../constants/colorScheme";

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

    renderSvg(props) {
        let {
            svgID,
            canvasHeight,
            input,
            output,
            clusterSliderUI,
            attributeList,
            brushSelectedCluster,
            modelName,
            individualSim
        } = props;

        /***
         * Terminate rendering condition
         */
        if (brushSelectedCluster.size === 0) return;

        /***
         * Canvas setup
         */
        const height = canvasHeight;
        const width = this.container.current.getBoundingClientRect().width;
        const svgRoot = d3.select("#" + svgID);
        svgRoot.style("width", width);
        const svgBase = svgRoot.select("g");
        const margin = { top: 50, right: 20, bottom: 20, left: 35 };

        /***
         *  Data processing
         */
        const nodeResKey = Object.keys(output["res"]);
        const selectedNodes = nodeResKey.filter(item => {
            return brushSelectedCluster.has(String(item));
        });

        const numberOfBins = clusterSliderUI.value;
        const dimensions = [...attributeList.selectedAttributes];

        selectedNodes.sort(
            (a, b) => output["res"][a]["rank"] - output["res"][b]["rank"]
        );
        const outputYScale = d3
            .scaleBand()
            .domain(selectedNodes)
            .range([margin.top, height - margin.bottom]);

        let inputNodes = Object.keys(input["topological_feature"]["pagerank"]);
        let bound = d3.extent(
            inputNodes.map(node => {
                return input["topological_feature"]["pagerank"][node]["score"];
            })
        );

        inputNodes.sort(
            (a, b) =>
                input["topological_feature"]["pagerank"][a]["rank"] -
                input["topological_feature"]["pagerank"][b]["rank"]
        );
        inputNodes = inputNodes.slice(
            output["res"][selectedNodes[0]]["rank"] - 1,
            output["res"][selectedNodes[selectedNodes.length - 1]]["rank"]
        );

        const inputBins = {};
        let bandwidth = (bound[1] - bound[0]) / numberOfBins;
        const inputNodesGroupMap = {};
        const inputNodesBinMap = {};
        let maxInstanceSizeOfBins = 0;
        inputNodes.forEach(node => {
            let itemSetID = "";
            dimensions.forEach((d, i) => {
                itemSetID += input["nodes"][node][d];
            });
            inputNodesGroupMap[node] = itemSetID;
            let index = Math.ceil(
                input["topological_feature"]["pagerank"][node]["score"] /
                    bandwidth
            );
            if (index < 0) index = 0;
            if (index >= numberOfBins) index = numberOfBins - 1;
            if (!inputBins.hasOwnProperty(index)) {
                inputBins[index] = {
                    stat: {},
                    itemSetID: itemSetID,
                    instances: []
                };
            }
            if (!inputBins[index]["stat"].hasOwnProperty(itemSetID)) {
                inputBins[index]["stat"][itemSetID] = 0;
            }
            inputNodesBinMap[node] = index;
            inputBins[index]["stat"][itemSetID]++;
            inputBins[index]["instances"].push(node);
            maxInstanceSizeOfBins = Math.max(
                maxInstanceSizeOfBins,
                inputBins[index]["instances"].length
            );
        });
        // console.log(inputBins);

        const inputYScale = d3
            .scaleBand()
            .domain(inputNodes)
            .range([margin.top, height - margin.bottom]);

        const linkArea = svgBase.append("g");
        const inputX = 350;
        const rectLength = 50;
        const outputX = 500;

        const outputGroupNodesX = 650;
        const outputGroupNodeLen = 70;

        const inputGroupNodesX = 100;
        const inputGroupNodeLen = 70;
        const groupHeight = 30;
        const outputNodes = Object.keys(output["res"]);
        bound = d3.extent(
            outputNodes.map(node => {
                return output["res"][node]["res"];
            })
        );
        bandwidth = (bound[1] - bound[0]) / numberOfBins;
        const outputBins = {};
        const outputNodesGroupMap = {};
        const outputNodesBinMap = {};
        const subgroups = {};

        selectedNodes.forEach(node => {
            let itemSetID = "";
            dimensions.forEach((d, i) => {
                itemSetID += input["nodes"][node][d];
            });
            outputNodesGroupMap[node] = itemSetID;
            if (!subgroups.hasOwnProperty(itemSetID)) {
                subgroups[itemSetID] = 1;
            } else {
                subgroups[itemSetID]++;
            }
            let index = Math.ceil(output["res"][node]["res"] / bandwidth);
            if (index < 0) index = 0;
            if (index >= numberOfBins) index = numberOfBins - 1;
            if (!outputBins.hasOwnProperty(index)) {
                outputBins[index] = {
                    stat: {},
                    itemSetID: itemSetID,
                    instances: []
                };
            }
            if (!outputBins[index]["stat"].hasOwnProperty(itemSetID)) {
                outputBins[index]["stat"][itemSetID] = 0;
            }
            outputNodesBinMap[node] = index;
            outputBins[index]["stat"][itemSetID]++;
            outputBins[index]["instances"].push(node);
            maxInstanceSizeOfBins = Math.max(
                maxInstanceSizeOfBins,
                outputBins[index]["instances"].length
            );
        });

        const sortedOutputBinKeys = Object.keys(outputBins);
        sortedOutputBinKeys.sort((a, b) => b - a);

        let subgroupIDs = Object.keys(subgroups);
        subgroupIDs.sort((a, b) => subgroups[b] - subgroups[a]);
        console.log(subgroups);
        const nodeColor = d3
            .scaleOrdinal()
            .domain(subgroupIDs)
            .range(d3.schemeTableau10);

        //////////////////////////////////////////////////////////////////////////////
        // Input Nodes
        linkArea
            .selectAll(".rectInput")
            .data(inputNodes)
            .join("rect")
            .attr("id", d => "inputNodeID" + d)
            .attr(
                "class",
                d =>
                    "rectInput " +
                    "inputNode" +
                    inputNodesGroupMap[d] +
                    "inputBin" +
                    inputNodesBinMap[d]
            )
            .attr("x", inputX)
            .attr("y", d => inputYScale(d))
            .attr("width", rectLength)
            .attr("height", inputYScale.bandwidth() - 1)
            .attr("fill", d => nodeColor(inputNodesGroupMap[d]))
            .attr("opacity", 0.5)
            .on("mouseover", function(d, i) {
                d3.select(this)
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.85);
                d3.select("#outputNodeID" + d)
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.85);
                d3.select("#link" + d)
                    .transition()
                    .duration("50")
                    .attr("stroke", "black");
            })
            .on("mouseout", function(d, i) {
                d3.select(this)
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.5);
                d3.select("#outputNodeID" + d)
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.5);
                d3.select("#link" + d)
                    .transition()
                    .duration("50")
                    .attr("stroke", "#ccc");
            })
            .append("title")
            .text(
                d =>
                    "ID: " +
                    d +
                    " Rank: " +
                    input["topological_feature"]["pagerank"][d]["rank"] +
                    " Rank Score: " +
                    input["topological_feature"]["pagerank"][d][
                        "score"
                    ].toFixed(6)
            );

        /////////////////////////////////////////////////////////////////////////////////
        // Output Nodes
        linkArea
            .selectAll(".rectOutput")
            .data(selectedNodes)
            .join("rect")
            .attr("id", d => "outputNodeID" + d)
            .attr(
                "class",
                d =>
                    "outputNode" +
                    outputNodesGroupMap[d] +
                    "outputBin" +
                    outputNodesBinMap[d]
            )
            .attr("x", outputX)
            .attr("y", d => outputYScale(d))
            .attr("width", rectLength)
            .attr("height", outputYScale.bandwidth() - 1)
            .attr("fill", d => nodeColor(outputNodesGroupMap[d]))
            .attr("opacity", 0.5)
            .on("mouseover", function(d, i) {
                d3.select(this)
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.85);
                d3.select("#outputNodeID" + d)
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.85);
                d3.select("#link" + d)
                    .transition()
                    .duration("50")
                    .attr("stroke", "black");
            })
            .on("mouseout", function(d, i) {
                d3.select(this)
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.5);
                d3.select("#outputNodeID" + d)
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.5);
                d3.select("#link" + d)
                    .transition()
                    .duration("50")
                    .attr("stroke", "#ccc");
            })
            .append("title")
            .text(
                d =>
                    "ID: " +
                    d +
                    " Rank: " +
                    output["res"][d]["rank"] +
                    " Rank Score: " +
                    output["res"][d]["res"].toFixed(6)
            );

        const sortedInputBinKeys = Object.keys(inputBins);
        sortedInputBinKeys.sort((a, b) => b - a);

        //////////////////////////////////////////////////////////////////////////////////////////
        // input group links
        const inputGroupXOffset = 120;
        const inputGroupYOffset = 20;
        const inputGroupYScale = d3
            .scaleBand()
            .domain(sortedInputBinKeys)
            .range([margin.top, height - margin.bottom]);

        const inputPathData = sortedInputBinKeys.map((d, i) => {
            if (i % 2 === 0) {
                return {
                    binID: d,
                    area: [
                        {
                            x: inputGroupNodesX,
                            y0: inputGroupYScale(d) + inputGroupYOffset,
                            y1: inputGroupYScale(d) + inputGroupYOffset
                        },
                        {
                            x: inputX - 50,
                            y0: inputGroupYScale(d),
                            y1: inputGroupYScale(d) + inputGroupYOffset
                        },
                        {
                            x: inputX,
                            y0: inputYScale(inputBins[d]["instances"][0]),
                            y1:
                                inputYScale(
                                    inputBins[d]["instances"][
                                        inputBins[d]["instances"].length - 1
                                    ]
                                ) + inputYScale.bandwidth()
                        }
                    ]
                };
            } else {
                return {
                    binID: d,
                    area: [
                        {
                            x: inputGroupNodesX + inputGroupXOffset,
                            y0: inputGroupYScale(d) + inputGroupYOffset,
                            y1: inputGroupYScale(d) + inputGroupYOffset
                        },
                        {
                            x: inputX - 50,
                            y0: inputGroupYScale(d),
                            y1: inputGroupYScale(d) + inputGroupYOffset
                        },
                        {
                            x: inputX,
                            y0: inputYScale(inputBins[d]["instances"][0]),
                            y1:
                                inputYScale(
                                    inputBins[d]["instances"][
                                        inputBins[d]["instances"].length - 1
                                    ]
                                ) + inputYScale.bandwidth()
                        }
                    ]
                };
            }
        });

        let area = d3
            .area()
            .curve(d3.curveBasis)
            .x(d => d.x)
            .y0(d => d.y0)
            .y1(d => d.y1);

        linkArea
            .append("g")
            .attr("class", "inputPathGroup")
            .selectAll("path")
            .data(inputPathData)
            .enter()
            .append("path")
            .attr("class", "area")
            .attr("id", (d, i) => "inputArea" + d.binID)
            .attr("d", d => area(d.area))
            .style("stroke", regularGreyStroke)
            .attr("fill", regularGreyDark)
            .attr("opacity", 0.3);

        ////////////////////////////////////////////////////////////////////////////////////////
        // input group nodes
        const generalRadius = 50;
        const baseRadius = 10;

        const pie = d3.pie().value(d => d.totalSum - d.preSum);
        const arc = d3
            .arc()
            .innerRadius(0)
            .outerRadius(
                d =>
                    (d["data"]["totalSum"] / maxInstanceSizeOfBins) *
                        generalRadius +
                    baseRadius
            );

        linkArea
            .selectAll(".circleInputSummaryGroup")
            .data(sortedInputBinKeys)
            .enter()
            .append("g")
            .attr("class", "circleInputSummaryGroup")
            .attr("transform", (d, i) => {
                if (i % 2 === 0) {
                    return (
                        "translate(" +
                        inputGroupNodesX +
                        "," +
                        (inputGroupYScale(d) + inputGroupYOffset) +
                        ")"
                    );
                } else {
                    return (
                        "translate(" +
                        (inputGroupNodesX + inputGroupXOffset) +
                        "," +
                        (inputGroupYScale(d) + inputGroupYOffset) +
                        ")"
                    );
                }
            })
            .selectAll(".circleInputSummary")
            .data(d => {
                const statGroupIDs = Object.keys(inputBins[d]["stat"]);
                statGroupIDs.sort(
                    (a, b) => inputBins[d]["stat"][b] - inputBins[d]["stat"][a]
                );
                let tempPrefix = 0;
                return pie(
                    statGroupIDs.map(id => {
                        const tempRes = {
                            id: id,
                            binID: d,
                            preSum: tempPrefix,
                            totalSum: inputBins[d]["instances"].length
                        };
                        tempPrefix += inputBins[d]["stat"][id];
                        return tempRes;
                    })
                );
            })
            .join("path")
            .attr("class", d => {
                return "circleInputSummary " + "group" + d["data"]["id"];
            })
            .attr("d", arc)
            .attr("fill", d => nodeColor(d["data"]["id"]))
            .attr("opacity", 0.5)
            .on("mouseover", function(d, i) {
                d3.selectAll(".group" + d["data"]["id"])
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.85);

                d3.select("#inputArea" + d["data"]["binID"])
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.85);

                d3.selectAll(
                    ".inputNode" +
                        d["data"]["id"] +
                        "inputBin" +
                        d["data"]["binID"]
                )
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.85);
            })
            .on("mouseout", function(d, i) {
                d3.selectAll(".group" + d["data"]["id"])
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.5);
                d3.select("#inputArea" + d["data"]["binID"])
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.3);
                d3.selectAll(
                    ".inputNode" +
                        d["data"]["id"] +
                        "inputBin" +
                        d["data"]["binID"]
                )
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.5);
            })
            .append("title")
            .text(
                (d, i) =>
                    "Group" + d["data"]["id"] + ": " +
                    (
                        (inputBins[d["data"]["binID"]]["stat"][d["data"]["id"]] * 100) /
                        d["data"]["totalSum"]
                    ).toFixed(2) +
                    "%"
            );

        //////////////////////////////////////////////////////////////////////////////////////////
        // output group links
        const outputGroupXOffset = 150;
        const outputGroupYOffset = 30;
        const outputGroupYScale = d3
            .scaleBand()
            .domain(sortedOutputBinKeys)
            .range([margin.top, height - margin.bottom]);
        const outputPathData = sortedOutputBinKeys.map((d, i) => {
            if (i % 2 === 0) {
                return {
                    binID: d,
                    area: [
                        {
                            x: outputX + rectLength,
                            y0: outputYScale(outputBins[d]["instances"][0]),
                            y1:
                                outputYScale(
                                    outputBins[d]["instances"][
                                        outputBins[d]["instances"].length - 1
                                    ]
                                ) + outputYScale.bandwidth()
                        },
                        {
                            x: outputX + rectLength + 50,
                            y0: outputGroupYScale(d),
                            y1: outputGroupYScale(d) + outputGroupYOffset
                        },
                        {
                            x: outputGroupNodesX + outputGroupXOffset,
                            y0: outputGroupYScale(d) + outputGroupYOffset,
                            y1: outputGroupYScale(d) + outputGroupYOffset
                        }
                    ]
                };
            } else {
                return {
                    binID: d,
                    area: [
                        {
                            x: outputX + rectLength,
                            y0: outputYScale(outputBins[d]["instances"][0]),
                            y1:
                                outputYScale(
                                    outputBins[d]["instances"][
                                        outputBins[d]["instances"].length - 1
                                    ]
                                ) + outputYScale.bandwidth()
                        },
                        {
                            x: outputX + rectLength + 50,
                            y0: outputGroupYScale(d),
                            y1: outputGroupYScale(d) + outputGroupYOffset
                        },
                        {
                            x: outputGroupNodesX,
                            y0: outputGroupYScale(d) + outputGroupYOffset,
                            y1: outputGroupYScale(d) + outputGroupYOffset
                        }
                    ]
                };
            }
        });

        linkArea
            .append("g")
            .attr("class", "outputPathGroup")
            .selectAll("path")
            .data(outputPathData)
            .enter()
            .append("path")
            .attr("class", "area")
            .attr("id", (d, i) => "outputArea" + d.binID)
            .attr("d", d => area(d.area))
            .style("stroke", regularGreyStroke)
            .attr("fill", regularGreyDark)
            .attr("opacity", 0.3);

        ///////////////////////////////////////////////////////////////////////////////////////
        // output group nodes

        linkArea
            .selectAll(".circleOutputSummaryGroup")
            .data(sortedOutputBinKeys)
            .enter()
            .append("g")
            .attr("class", "circleOutputSummaryGroup")
            .attr("transform", (d, i) => {
                if (i % 2 === 0) {
                    return (
                        "translate(" +
                        (outputGroupNodesX + outputGroupXOffset) +
                        "," +
                        (outputGroupYScale(d) + outputGroupYOffset) +
                        ")"
                    );
                } else {
                    return (
                        "translate(" +
                        outputGroupNodesX +
                        "," +
                        (outputGroupYScale(d) + outputGroupYOffset) +
                        ")"
                    );
                }
            })
            .selectAll(".circleOutputSummary")
            .data(d => {
                const statGroupIDs = Object.keys(outputBins[d]["stat"]);
                statGroupIDs.sort(
                    (a, b) =>
                        outputBins[d]["stat"][b] - outputBins[d]["stat"][a]
                );
                let tempPrefix = 0;
                return pie(
                    statGroupIDs.map(id => {
                        const tempRes = {
                            id: id,
                            binID: d,
                            preSum: tempPrefix,
                            totalSum: outputBins[d]["instances"].length
                        };
                        tempPrefix += outputBins[d]["stat"][id];
                        return tempRes;
                    })
                );
            })
            .join("path")
            .attr("d", arc)
            .attr(
                "class",
                d => "circleOutputSummary " + "group" + d["data"]["id"]
            )
            .attr("stroke", regularGreyStroke)
            .attr("fill", d => nodeColor(d["data"]["id"]))
            .attr("opacity", 0.5)
            .on("mouseover", function(d, i) {
                d3.selectAll(".group" + d["data"]["id"])
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.85);

                d3.select("#outputArea" + d["data"]["binID"])
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.85);

                d3.selectAll(
                    ".outputNode" +
                        d["data"]["id"] +
                        "outputBin" +
                        d["data"]["binID"]
                )
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.85);
            })
            .on("mouseout", function(d, i) {
                d3.selectAll(".group" + d["data"]["id"])
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.5);
                d3.select("#outputArea" + d["data"]["binID"])
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.3);
                d3.selectAll(
                    ".outputNode" +
                        d["data"]["id"] +
                        "outputBin" +
                        d["data"]["binID"]
                )
                    .transition()
                    .duration("50")
                    .attr("opacity", 0.5);
            })
            .append("title")
            .text(
                (d, i) =>
                    "Group" + d["data"]["id"] + ": " +
                    (
                        (outputBins[d["data"]["binID"]]["stat"][d["data"]["id"]] * 100) /
                        d["data"]["totalSum"]
                    ).toFixed(2) +
                    "%"
            );


        ///////////////////////////////////////////////////////////////////////////////////////////
        // input and output links
        const links = [];
        inputNodes.forEach(node => {
            if (brushSelectedCluster.has(node)) {
                links.push({
                    id: node,
                    x1: inputX + rectLength,
                    y1: inputYScale(node) + outputYScale.bandwidth() / 2,
                    x2: outputX,
                    y2: outputYScale(node) + +outputYScale.bandwidth() / 2
                });
            }
        });

        linkArea
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("id", d => "link" + d.id)
            .attr("x1", d => d.x1)
            .attr("y1", d => d.y1)
            .attr("x2", d => d.x2)
            .attr("y2", d => d.y2)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 2);

        // const yAxis = svgBase
        //     .append("g")
        //     .attr("transform", "translate(" + inputX + ",0)")
        //     .call(
        //         d3.axisLeft(outputYScale).tickFormat((t, i) => {
        //             if (i === 0 || i === selectedNodes.length - 1) {
        //                 return "rank " + output["res"][t]["rank"];
        //             } else {
        //                 return "";
        //             }
        //         })
        //     );

        const textGroup = linkArea.append("g");
        const textTop = 30;
        textGroup
            .append("text")
            .attr("x", inputGroupNodesX)
            .attr("y", textTop)
            .text("Input Similar Instances");

        textGroup
            .append("text")
            .attr("x", inputX)
            .attr("y", textTop)
            .text(individualSim);

        textGroup
            .append("text")
            .attr("x", outputX)
            .attr("y", textTop)
            .text(modelName);

        textGroup
            .append("text")
            .attr("x", outputGroupNodesX)
            .attr("y", textTop)
            .text("Output Similar Instances");
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
