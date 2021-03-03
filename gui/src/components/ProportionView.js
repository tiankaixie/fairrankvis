import * as React from "react";
import * as d3 from "d3";
import { connect } from "react-redux";

const mapStateToProps = state => {
    return {
        input: state.input,
        output: state.output,
        modelName: state.modelName,
        individualSim: state.individualSim,
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
        const margin = { top: 30, right: 20, bottom: 20, left: 65 };

        /***
         * Data processing
         */
        const resultTopK = {};
        const inputTopK = {};
        const nodeResKey = Object.keys(output["res"]);
        const selectedNodes = nodeResKey.filter(item => {
            return brushSelectedCluster.has(String(item));
        });
        const dimensions = [...attributeList.selectedAttributes];
        selectedNodes.sort(
            (a, b) => output["res"][a]["rank"] - output["res"][b]["rank"]
        );
        selectedNodes.forEach(node => {
            let itemSetID = "";
            dimensions.forEach(d => {
                itemSetID += input["nodes"][node][d];
            });
            if (!resultTopK.hasOwnProperty(itemSetID)) {
                resultTopK[itemSetID] = 0;
            }
            resultTopK[itemSetID]++;
        });

        let inputNodes = Object.keys(input["topological_feature"]["pagerank"]);
        inputNodes.sort(
            (a, b) =>
                input["topological_feature"]["pagerank"][a]["rank"] -
                input["topological_feature"]["pagerank"][b]["rank"]
        );
        inputNodes = inputNodes.slice(
            output["res"][selectedNodes[0]]["rank"] - 1,
            output["res"][selectedNodes[selectedNodes.length - 1]]["rank"]
        );
        console.log(inputNodes);
        inputNodes.forEach(node => {
            let itemSetID = "";
            dimensions.forEach(d => {
                itemSetID += input["nodes"][node][d];
            });
            if (!inputTopK.hasOwnProperty(itemSetID)) {
                inputTopK[itemSetID] = 0;
            }
            inputTopK[itemSetID]++;
        });

        const commonKeys = new Set([
            ...Object.keys(inputTopK),
            ...Object.keys(resultTopK)
        ]);
        console.log(inputTopK);
        console.log(resultTopK);
        commonKeys.forEach(key => {
            if (!inputTopK.hasOwnProperty(key)) {
                inputTopK[key] = 0;
            }
            if (!resultTopK.hasOwnProperty(key)) {
                resultTopK[key] = 0;
            }
        });
        const data = [];

        data.push(Object.assign({}, { name: individualSim }, inputTopK));
        data.push(Object.assign({}, { name: modelName }, resultTopK));

        console.log(data);

        const xScale = d3
            .scaleLinear()
            .range([margin.left, width - margin.right]);

        const yScale = d3
            .scaleBand()
            .domain(data.map(d => d.name))
            .range([margin.top, height - margin.bottom])
            .padding(0.08);

        console.log(Object.keys(data[0]).filter(d => d !== "name"));
        const series = d3
            .stack()
            .keys(Object.keys(data[0]).filter(d => d !== "name"))
            .offset(d3.stackOffsetExpand)(data)
            .map(d => (d.forEach(v => (v.key = d.key)), d));

        console.log(series);
        let subgroupIDs = Object.keys(resultTopK);
        subgroupIDs.sort((a, b) => resultTopK[b] - resultTopK[a]);

        const nodeColor = d3
            .scaleOrdinal()
            .domain(subgroupIDs)
            .range(d3.schemeTableau10);

        const xAxis = g =>
            g
                .attr("transform", `translate(0,${margin.top})`)
                .call(d3.axisTop(xScale).ticks(width / 100, "%"))
                .call(g => g.selectAll(".domain").remove());

        const yAxis = g =>
            g
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(yScale).tickSizeOuter(0))
                .call(g => g.selectAll(".domain").remove());

        svgBase
            .append("g")
            .selectAll("g")
            .data(series)
            .enter()
            .append("g")
            .attr("fill", d => nodeColor(d.key))
            .attr("opacity", 0.5)
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => xScale(d[0]))
            .attr("y", (d, i) => yScale(d.data.name))
            .attr("width", d => xScale(d[1]) - xScale(d[0]))
            .attr("height", yScale.bandwidth())
            .on("mouseover", d => {
                d3.select(this)
                    .transition()
                    .duration("50")
                    .attr("stroke", "black");
            })
            .append("title")
            .text((d, i) => ((xScale(d[1]) - xScale(d[0])) * 100 / (width - margin.right - margin.left)).toFixed(2) + "%");

        svgBase.append("g").call(xAxis);

        svgBase.append("g").call(yAxis);
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
