import React from "react";
import * as d3 from "d3";
import { connect } from "react-redux";
import {
    regularGrey,
    regularGreyDark,
    regularGreyStroke,
    subGroupColor,
    subGroupHighlightColor,
    textGrey
} from "../constants/colorScheme";
import { displayName } from "../constants/text";

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

    clustering(nodeRankingScores, nodes, nodeItemSetIDMap) {
        console.log("kmeans!!!");
        const nodeItemSetSet = new Set();
        let clusterMaker = require("clusters");
        let clusterNumber = 7;
        clusterMaker.k(clusterNumber);
        clusterMaker.iterations(750);
        clusterMaker.data(nodeRankingScores);
        let nodeIter = 0;
        let clusters = Object.values(clusterMaker.clusters()).map(cluster => {
            // console.log(cluster["points"].length);
            let count = 0;
            const clusterSet = [];
            while (count < cluster["points"].length) {
                const nodeID = nodes[nodeIter];
                nodeItemSetSet.add(nodeItemSetIDMap[nodeID]);
                clusterSet.push({
                    nodeID: nodeID,
                    itemSetID: nodeItemSetIDMap[nodeID]
                });
                nodeIter++;
                count++;
            }
            return clusterSet;
        });
        return { cluster: clusters, nodeItemSetSet: nodeItemSetSet };
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
            individualSim,
            showAdvantagedNode,
            showDisadvantagedNode,
            nodeColor
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
        const margin = { top: 50, right: 20, bottom: 20, left: 35 };

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
            nodeItemSetIDMap
        );
        const targetClusters = targetClusteringRes["cluster"];
        const targetNodeItemSetSet = targetClusteringRes["nodeItemSetSet"];

        console.log(targetClusters);
        const targetNodeYScale = d3
            .scaleBand()
            .domain(targetClusters.map((item, i) => i))
            .range([margin.top, height - margin.bottom]);

        /***
         *  Data processing: Base Model Nodes
         */
        let baseModelNodes = Object.keys(
            input["topological_feature"]["pagerank"]
        );
        // let bound = d3.extent(
        //     inputNodes.map(node => {
        //         return input["topological_feature"]["pagerank"][node]["score"];
        //     })
        // );

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
            nodeItemSetIDMap
        );

        const baseClusters = baseClustersRes["cluster"];
        const baseNodeItemSetSet = baseClustersRes["nodeItemSetSet"];
        console.log(baseClusters);

        const targetNodesSVG = svgBase.append("g");
        const targetNodeX = 50;

        /**
         * Start Drawing
         * */
        const unionedSelectedItemSet = [
            ...new Set(Object.values(nodeItemSetIDMap))
        ].filter(
            item =>
                baseNodeItemSetSet.has(item) || targetNodeItemSetSet.has(item)
        );
        unionedSelectedItemSet.sort();
        console.log(unionedSelectedItemSet);

        // const nodeColor = d3
        //     .scaleOrdinal()
        //     .domain(unionedSelectedItemSet)
        //     .range(subGroupColor);

        const targetClusterGroupSVG = targetNodesSVG
            .selectAll(".targetClusterGroup")
            .data(targetClusters)
            .enter()
            .append("g")
            .attr("class", "targetClusterGroup")
            .attr("id", (d, i) => "targetNodeCluster" + i)
            .attr("transform", (d, i) => "translate(0, " + 50 * (i + 1) + ")");

        targetClusterGroupSVG
            .selectAll(".targetRect")
            .data(d => {
                // console.log(d);
                return d;
            })
            .join("rect")
            .attr("x", (d, i) => i * 30)
            .attr("y", 0)
            .attr("height", 50)
            .attr("width", d => 30)
            .attr("stroke", "#fff")
            .attr("fill", d => nodeColor(d["itemSetID"]));
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
