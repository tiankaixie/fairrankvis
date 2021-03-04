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

class IndividualGroupShift extends React.Component {
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
        let { svgID, canvasHeight, data, extent, nodeColor } = props;

        /***
         * Terminate rendering condition
         */
        if (data === 0) return;

        /***
         * Canvas setup
         */
        const height = canvasHeight;
        const width = this.container.current.getBoundingClientRect().width;
        const svgRoot = d3.select("#" + svgID);
        svgRoot.style("width", width);
        const svgBase = svgRoot.select("g");
        const margin = {
            top: 25,
            right: 25,
            bottom: 20,
            left: 5
        };

        /***
         * Data processing
         */
        // console.log(data);
        const barHeight = 15;
        // const statXScale = d3
        //     .scaleBand()
        //     .domain(statData.map(x => x.id))
        //     .range([margin.left, width - margin.right]);
        //
        const statXScale = d3
            .scaleLinear()
            .domain(extent)
            .range([margin.left, width - margin.right]);

        svgBase
            .append("g")
            .attr("transform", "translate(0," + (margin.top + barHeight) + ")")
            .call(d3.axisBottom(statXScale).ticks(5));

        svgBase
            .selectAll("rect")
            .data([data])
            .join("rect")
            .attr("x", d => {
                if (d.value >= 0) {
                    return statXScale(0);
                } else {
                    return statXScale(d.value);
                }
            })
            .attr("y", margin.top)
            .attr("width", d => {
                if (d.value >= 0) {
                    return statXScale(d.value / d.count) - statXScale(0);
                } else {
                    return statXScale(0) - statXScale(d.value / d.count);
                }
            })
            .attr("height", d => {
                return barHeight;
            })
            .attr("fill", d => nodeColor(d.id))
            .attr("opacity", 0.5)
            .append("title")
            .text(d => (d.value / d.count).toFixed(2));
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

export default connect(mapStateToProps)(IndividualGroupShift);
