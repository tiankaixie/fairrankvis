import * as React from "react";
import * as d3 from "d3";
import { connect } from "react-redux";

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

class ProportionView extends React.Component {
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
        const margin = { top: 60, right: 20, bottom: 20, left: 65 };
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

export default connect(mapStateToProps)(ProportionView);
