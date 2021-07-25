import * as React from "react";
import * as d3 from "d3";
import { connect } from "react-redux";
import { kldivergence } from "mathjs";
import { regularGrey } from "../constants/colorScheme";

// const normalized = require("array-normalize");
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

// const mapDispatchToProps = dispatch => {
// };

class KLDivergenceView extends React.Component {
    constructor(props) {
        super(props);
        this.state = { canvasWidth: 0 };
        this.container = React.createRef();
    }

    componentDidMount() {
        // console.log("mount");
        const canvasWidth = this.container.current.getBoundingClientRect()
            .width;
        d3.select("#kldivergence").style("width", canvasWidth);
        this.setState({ canvasWidth: canvasWidth });
        this.initializeCanvas();
    }

    shouldComponentUpdate(nextProps) {
        return false;
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.updateCanvas(nextProps);
    }

    renderSvg(baseGroup, props) {
        // console.log("rend!!!!!!!!!!!!!!!!!!")
        let {
            canvasHeight,
            input,
            attributeList,
            brushSelectedCluster
        } = props;
        const klHeight = canvasHeight;
        const klWidth = this.container.current.getBoundingClientRect().width;
        const margin = { left: 50, bottom: 20, right: 20, top: 10 };
        // const margin.left = 60;
        // const margin.bottom = 20;
        // const margin.top = 10;
        const klchartData = {};
        const wholeData = Object.keys(input.nodes).map(key => input.nodes[key]);
        // console.log(wholeData);
        // console.log(brushSelectedCluster);
        const data = wholeData.filter(item => {
            return brushSelectedCluster.has(String(item.id));
        });
        const dimensions = d3.keys(data[0]).filter(function(d) {
            let oneDimension = data.map(p => Number(p[d]));
            oneDimension.sort((a, b) => b - a);
            return (
                d !== "x" &&
                d !== "y" &&
                d !== "sim_x" &&
                d !== "sim_y" &&
                attributeList.selectedAttributes.has(d)
            );
        });
        // console.log(dimensions);
        dimensions.forEach(d => {
            // console.log(d);
            let attributeStatItem = {};
            let wholeAttributeStatItem = {};
            data.forEach(item => {
                if (attributeStatItem.hasOwnProperty(item[d])) {
                    attributeStatItem[item[d]]++;
                } else {
                    attributeStatItem[item[d]] = 1;
                }
            });
            wholeData.forEach(item => {
                if (wholeAttributeStatItem.hasOwnProperty(item[d])) {
                    wholeAttributeStatItem[item[d]]++;
                } else {
                    wholeAttributeStatItem[item[d]] = 1;
                }
            });

            let attributeSum = Object.values(attributeStatItem).reduce(
                (a, b) => a + b,
                0
            );

            let wholeAttributeSum = Object.values(
                wholeAttributeStatItem
            ).reduce((a, b) => a + b, 0);

            const attributesProb = Object.keys(
                wholeAttributeStatItem
            ).map(key =>
                key in attributeStatItem
                    ? attributeStatItem[key] / attributeSum
                    : 0.0000000000001
            );
            const wholeAttributesProb = Object.values(
                wholeAttributeStatItem
            ).map(value => value / wholeAttributeSum);
            klchartData[d] = kldivergence(attributesProb, wholeAttributesProb);
        });
        console.log(klchartData);
        let klY = d3
            .scaleBand()
            .domain(Object.keys(klchartData))
            .range([margin.top, klHeight - margin.top - margin.bottom])
            .padding(0.3);

        let klX = d3
            .scaleSqrt()
            .domain([0, 1])
            .range([0, klWidth - margin.left - margin.right]);

        const klbase = d3.select("#kldivergence-base");

        klbase
            .selectAll(".klbar")
            .data(Object.keys(klchartData))
            .enter()
            .append("rect")
            .attr("class", "klbar")
            .attr("x", function(d) {
                return margin.left;
            })
            .attr("width", function(d) {
                return klX(klchartData[d]) - margin.left - margin.right;
            })
            .attr("y", d => margin.top + klY(d))
            .attr("height", klY.bandwidth())
            .attr("fill", regularGrey)
            .attr("opacity", 1);

        if (Object.keys(klchartData).length > 0) {
            klbase
                .append("g")
                .attr(
                    "transform",
                    "translate(" + margin.left + "," + margin.top + ")"
                )
                .call(d3.axisLeft(klY))
                .selectAll("text")
                .attr("font-size", "0.8rem");

            klbase
                .append("g")
                .attr(
                    "transform",
                    "translate(" +
                        margin.left +
                        "," +
                        (klHeight - margin.bottom) +
                        ")"
                )
                .call(d3.axisBottom(klX).ticks(5))
                .selectAll("text")
                .attr("font-size", "0.8rem");

            klbase
                .append("g")
                .attr("transform", "translate(" + 0 + "," + margin.top + ")")
                .append("text")
                .attr("font-size", "0.8rem")
                .text("Attribute");

            klbase
                .append("g")
                .attr(
                    "transform",
                    "translate(" +
                        (Number(klWidth) - margin.right - margin.left) +
                        "," +
                        (klHeight - margin.top - margin.bottom) +
                        ")"
                )
                .append("text")
                .attr("x", -5)
                .attr("font-size", "0.8rem")
                .text("Divergence");
        }
    }

    /**
     * Entry point
     * @returns None
     */
    initializeCanvas() {
        const baseGroup = d3.select("#kldivergence-base");
        console.log(this.state.canvasWidth);

        this.renderSvg(baseGroup, this.props);

        baseGroup.raise();
    }

    /***
     * When updating the props, according canvas needs to be updated.
     * Remove original canvas and draw a new one.
     * @param props {Object} from React.Component
     */
    updateCanvas(props) {
        const svgRoot = d3.select("#kldivergence");
        const canvasWidth = this.container.current.getBoundingClientRect()
            .width;
        svgRoot.style("width", canvasWidth);
        let baseGroup = d3.select("#kldivergence-base");
        baseGroup.remove();
        baseGroup = svgRoot.append("g").attr("id", "kldivergence-base");
        this.renderSvg(baseGroup, props);
    }

    render() {
        const { canvasHeight } = this.props;
        return (
            <div ref={this.container}>
                <svg id={"kldivergence"} height={canvasHeight}>
                    <g id={"kldivergence-base"} height="100%" width="100%" />
                </svg>
            </div>
        );
    }
}

export default connect(mapStateToProps)(KLDivergenceView);
