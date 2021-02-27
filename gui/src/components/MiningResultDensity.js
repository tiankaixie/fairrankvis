import * as React from "react";
import * as d3 from "d3";
import { connect } from "react-redux";
import { updateBrushClusterSelected, updateLassoSelected } from "../actions";

const mapStateToProps = state => {
    return {
        input: state.input,
        output: state.output,
        clusterList: state.ui.clusterList,
        clusterSliderUI: state.ui.clusterSliderUI
    };
};

const mapDispatchToProps = dispatch => {
    return {
        updateLassoSelected: selectedNodes =>
            dispatch(updateLassoSelected(selectedNodes)),
        updateBrushClusterSelected: selectedSet =>
            dispatch(updateBrushClusterSelected(selectedSet))
    };
};

class MiningResultDensity extends React.Component {
    constructor(props) {
        super(props);
        this.container = React.createRef();
    }

    componentDidMount() {
        const canvasWidth = this.container.current.getBoundingClientRect()
            .width;
        d3.select("#mining-result-density").style("width", canvasWidth);
        this.initializeCanvas();
    }

    componentWillReceiveProps(nextProps, nextContext) {
        const { miningResultControl } = this.props;
        const { output } = nextProps;
        if (Object.keys(output.res).length === 0) return;
        // 2d resg
        if (Array.isArray(Object.values(output.res)[0]["res"])) {
            if (miningResultControl === nextProps.miningResultControl) {
                this.updateCanvas(nextProps);
            } else {
                if (nextProps.miningResultControl === "zoom") {
                    d3.select("#zoomRect2").attr("display", "block");
                } else {
                    d3.select("#zoomRect2").attr("display", "none");
                }
            }
        }
        // 1d res
        else {
            this.updateCanvas(nextProps);
        }
    }

    renderHistogram(baseGroup, props) {
        let {
            canvasHeight,
            output,
            clusterSliderUI,
            updateBrushClusterSelected
        } = props;
        const margin = { top: 24, right: 25, bottom: 30, left: 45 };
        const height = canvasHeight;
        const width = this.container.current.getBoundingClientRect().width;

        let bins = [];
        let domains = [];
        let bandwidth = 1;
        const k = clusterSliderUI.value;
        const tempRes = Object.keys(output.res).map(key => {
            return output.res[key].res;
        });

        const bound = d3.extent(tempRes);
        bandwidth = (bound[1] - bound[0]) / k;

        for (let i = 0; i < k; i++) {
            bins[i] = 0;
            domains[i] = ((i + 1) * bandwidth).toFixed(4);
        }
        tempRes.forEach(item => {
            const index = Math.ceil(item / bandwidth);
            if (index < 0) {
                bins[0]++;
            } else if (index >= k) {
                bins[k - 1]++;
            } else {
                bins[index]++;
            }
        });

        let svg = baseGroup;

        let xScale = d3
            .scaleBand()
            .domain(domains)
            .range([margin.left, width - margin.right]);

        let yScale = d3
            .scaleSqrt()
            .domain([0, d3.max(bins)])
            .range([height - margin.bottom, margin.top]);

        svg.selectAll(".frontBar")
            .data(bins)
            .enter()
            .append("rect")
            .attr("class", "frontBar")
            .attr("x", function(d, i) {
                return xScale(((i + 1) * bandwidth).toFixed(4));
            })
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(d))
            .attr("height", function(d) {
                return height - yScale(d) - margin.bottom;
            })
            .attr("fill", "#d0d0d0")
            .attr("opacity", 1);

        let brush = d3
            .brushX() // Add the brush feature using the d3.brush function
            .extent([
                [margin.left, margin.top],
                [width - margin.right, height - margin.bottom]
            ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("end", brushed);

        function brushed() {
            const extent = d3.brushSelection(this);

            function isIncluded(i) {
                return (
                    xScale(((i + 1) * bandwidth).toFixed(4)) >= extent[0] &&
                    xScale(((i + 1) * bandwidth).toFixed(4)) <= extent[1]
                );
            }

            const filteredData = Object.keys(output.res).filter(key => {
                let index = Math.ceil(output.res[key].res / bandwidth);
                if (index < 0) {
                    index = 0;
                } else if (index >= k) {
                    index = k - 1;
                }
                return isIncluded(index);
            });

            updateBrushClusterSelected(new Set(filteredData));

            d3.selectAll(".scatterPlotPoints").classed("fade", d => {
                let index = Math.ceil(output.res[d.id].res / bandwidth);
                if (index < 0) {
                    index = 0;
                } else if (index >= k) {
                    index = k - 1;
                }
                return !isIncluded(index);
            });

            d3.selectAll(".scatterPlotPoints").classed("brushSelected", d => {
                let index = Math.ceil(output.res[d.id].res / bandwidth);
                if (index < 0) {
                    index = 0;
                } else if (index >= k) {
                    index = k - 1;
                }
                return isIncluded(index);
            });

            d3.selectAll(".brushSelected").raise();
        }

        svg.append("g")
            .attr("class", "overview-brush")
            .call(brush);

        svg.append("g")
            .attr(
                "transform",
                "translate(0," + (Number(height) - Number(margin.bottom)) + ")"
            )
            .call(
                d3.axisBottom(xScale).tickFormat(t => {
                    return t;
                })
            )
            .selectAll("text")
            .attr("y", 9)
            .attr("x", -6)
            .attr("dy", ".35em")
            .attr("transform", "rotate(-35)")
            .attr("font-size", "0.5rem")
            .style("text-anchor", "end");

        svg.append("g")
            .attr("transform", "translate(" + margin.left + ",0)")
            .call(d3.axisLeft(yScale).ticks(6));
    }

    renderScatterPlot(baseGroup, props) {
        let { canvasHeight, output, updateBrushClusterSelected } = props;
        const height = canvasHeight;
        const width = this.container.current.getBoundingClientRect().width;

        let padding = 40;
        let dataset = [
            [23, 43],
            [54, 65],
            [2, 3],
            [77, 56],
            [80, 3]
        ];

        if (output.similarity.length > 0) {
            dataset = output.similarity;
        }

        //scale function
        let xScale = d3
            .scaleLinear()
            .domain([0, d3.max(dataset, d => d[0])])
            .range([padding, width - padding * 2]);

        let yScale = d3
            .scaleLinear()
            .domain([0, d3.max(dataset, d => d[1])])
            .range([height - padding, padding]);

        // Add a clipPath: everything out of this area won't be drawn.
        baseGroup
            .append("defs")
            .append("SVG:clipPath")
            .attr("id", "clip2")
            .append("SVG:rect")
            .attr("width", width)
            .attr("height", height)
            .attr("x", 0)
            .attr("y", 0);

        // Create the scatter letiable: where both the circles and the brush take place
        let scatter = baseGroup.append("g").attr("clip-path", "url(#clip)");

        const circles = scatter
            .selectAll("circle")
            .data(dataset)
            .enter()
            .append("circle")
            .attr("id", (d, i) => "mcircle" + Object.keys(output.res)[i])
            .attr("class", "miningPoints")
            .attr("cx", d => xScale(d[0]))
            .attr("cy", d => yScale(d[1]))
            .attr("r", 5)
            .attr("fill", "#e0e0e0")
            .attr("stroke", "#777777")
            .attr("stroke-width", 2);

        // Set the zoom and Pan features: how much you can zoom, on which part, and what to do when there is a zoom
        let zoom = d3
            .zoom()
            .scaleExtent([0.5, 2000]) // This control how much you can unzoom (x0.5) and zoom (x20)
            .extent([
                [0, 0],
                [width, height]
            ])
            .on("zoom", updateChart);

        // This add an invisible rect on top of the chart area. This rect can recover pointer events: necessary to understand when the user zoom
        baseGroup
            .append("rect")
            .attr("id", "zoomRect2")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr("transform", "translate(" + padding + "," + padding + ")")
            .call(zoom);
        // now the user can zoom and it will trigger the function called updateChart

        // A function that updates the chart when the user zoom and thus new boundaries are available
        function updateChart() {
            // recover the new scale
            let newX = d3.event.transform.rescaleX(xScale);
            let newY = d3.event.transform.rescaleY(yScale);

            // update axes with these new boundaries
            // xAxis.call(d3.axisBottom(newX));
            // yAxis.call(d3.axisLeft(newY));

            // update circle position
            scatter
                .selectAll("circle")
                .attr("cx", d => newX(d[0]))
                .attr("cy", d => newY(d[1]));
        }

    }

    renderSvg(baseGroup, props) {
        const { output } = props;
        if (Object.keys(output.res).length !== 0) {
            // this.renderScatterPlot(baseGroup, props);
            if (Array.isArray(Object.values(output.res)[0]["res"])) {
                this.renderScatterPlot(baseGroup, props);
            } else {
                this.renderHistogram(baseGroup, props);
            }
        }
    }

    /**
     * Entry point
     * @returns None
     */
    initializeCanvas() {
        const baseGroup = d3.select("#mining-result-density-base");
        this.renderSvg(baseGroup, this.props);
        baseGroup.raise();
    }

    /***
     * When updating the props, according canvas needs to be updated.
     * Remove original canvas and draw a new one.
     * @param props {Object} from React.Component
     */
    updateCanvas(props) {
        const svgRoot = d3.select("#mining-result-density");
        let baseGroup = d3.select("#mining-result-density-base");
        baseGroup.remove();
        baseGroup = svgRoot
            .append("g")
            .attr("id", "mining-result-density-base");
        this.renderSvg(baseGroup, props);
    }

    render() {
        const { canvasHeight } = this.props;
        const svgID = "mining-result-density";
        const svgIDBase = "mining-result-density-base";
        return (
            <div ref={this.container}>
                <svg id={svgID} style={{ height: canvasHeight }}>
                    <g
                        id={svgIDBase}
                        style={{ height: "100%", width: "100%" }}
                    />
                </svg>
            </div>
        );
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MiningResultDensity);
