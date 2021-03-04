import * as React from "react";
import * as d3 from "d3";
import { connect } from "react-redux";
import { regularGreyDark } from "../constants/colorScheme";

const mapStateToProps = state => {
    return {
        input: state.input,
        output: state.output,
        clusterList: state.ui.clusterList,
        attributeList: state.ui.attributeList,
        clusterSliderUI: state.ui.clusterSliderUI,
        brushSelectedCluster: state.brushSelectedCluster
    };
};

class IndividualGroupDistribution extends React.Component {
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
            groupID,
            clusterSliderUI,
            attributeList,
            brushSelectedCluster,
            modelName,
            individualSim,
            nodeColor
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
        const margin = { top: 10, right: 20, bottom: 20, left: 5 };

        /***
         * Data processing
         */
        const data = [];
        const nodeResKey = Object.keys(output["res"]);
        const selectedNodes = nodeResKey.filter(item => {
            return brushSelectedCluster.has(String(item));
        });
        const dimensions = [...attributeList.selectedAttributes];
        selectedNodes.sort(
            (a, b) => output["res"][a]["rank"] - output["res"][b]["rank"]
        );
        const rankStart = output["res"][selectedNodes[0]]["rank"];
        const rankEnd =
            output["res"][selectedNodes[selectedNodes.length - 1]]["rank"];

        const nodes = Object.keys(input["nodes"]);

        nodes.forEach(node => {
            let itemSetID = "";
            dimensions.forEach(d => {
                itemSetID += input["nodes"][node][d];
            });
            if (groupID !== itemSetID) {
                return;
            }
            let currRank = output["res"][node]["rank"];
            if (currRank >= rankStart && currRank <= rankEnd) {
                data.push({ x: currRank, y: -1 });
            }
            currRank = input["topological_feature"]["pagerank"][node]["rank"];
            if (currRank >= rankStart && currRank <= rankEnd) {
                data.push({ x: currRank, y: 1 });
            }
        });

        // console.log(data);

        const rankRange = [];
        for (let i = rankStart; i <= rankEnd; i++) {
            rankRange.push(i);
        }

        const statXScale = d3
            .scaleBand()
            .domain(rankRange)
            .range([margin.left, width - margin.right]);

        const statYScale = d3
            .scaleLinear()
            .domain([-1, 1])
            .range([height - margin.bottom, margin.top]);

        const detailView = svgBase.append("g").attr("class", "distribution");

        detailView
            .selectAll("rect")
            .data(data)
            .join("rect")
            .attr("x", d => statXScale(d.x))
            .attr("y", d => {
                if (d.y >= 0) {
                    return statYScale(d.y);
                } else {
                    return statYScale(0);
                }
            })
            .attr("width", statXScale.bandwidth())
            .attr("height", d => {
                if (d.y >= 0) {
                    return statYScale(0) - statYScale(d.y);
                } else {
                    return statYScale(d.y) - statYScale(0);
                }
            })
            .attr("fill", nodeColor(groupID))
            .attr("opacity", d => {
                if (d.y >= 0) {
                    return 0.5;
                } else {
                    return 1;
                }
            })
            .append("title")
            .text(d => (d.y).toFixed(2));

        detailView
            .append("g")
            .attr("transform", "translate(0," + statYScale(0) + ")")
            .call(
                d3.axisBottom(statXScale).tickFormat(t => {
                    if (t === rankStart || t === rankEnd) {
                        return t;
                    } else {
                        return "";
                    }
                })
            );

        detailView.selectAll("g.tick").select("line").remove();
    }

    /**
     * Entry point
     * @returns None
     */
    initializeCanvas() {
        this.renderSvg(this.props);
    }

    /***
     * When updating the props, according canvas needs to be updated.
     * Remove original canvas and draw a new one.
     * @param props {Object} from React.Component
     */
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

export default connect(mapStateToProps)(IndividualGroupDistribution);
