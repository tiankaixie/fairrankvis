import * as React from "react";
import * as d3 from "d3";
import { connect } from "react-redux";
import { updateTableData } from "../actions";
import {
    attributeColor,
    regularGreyDark,
    subGroupColor,
    textGrey
} from "../constants/colorScheme";

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

const mapDispatchToProps = dispatch => {
    return {
        updateTableData: newTableData => dispatch(updateTableData(newTableData))
    };
};

class ParallelSetView extends React.Component {
    constructor(props) {
        super(props);
        this.state = { canvasWidth: 0 };
        this.container = React.createRef();
    }

    componentDidMount() {
        // console.log(this.container.current.getBoundingClientRect().width);
        this.setState({
            canvasWidth: this.container.current.getBoundingClientRect().width
        });
        this.initializeCanvas();
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.updateCanvas(nextProps);
    }

    shouldComponentUpdate(nextProps) {
        return false;
    }

    renderStat(
        dimensions,
        data,
        wholeData,
        labels,
        highlightColor,
        highlightedDimension
    ) {
        const margin = { top: 24, right: 30, bottom: 30, left: 40 };
        const height = 100;
        const width = 170;
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
            let svg = d3.select("#attribute-stat-" + d).append("g");

            let xScale = d3
                .scaleBand()
                .domain(Object.keys(wholeAttributeStatItem))
                .range([margin.left, width - margin.right]);

            let yScale = d3
                .scaleLinear()
                .domain([0, d3.max(Object.values(wholeAttributeStatItem))])
                .range([height - margin.bottom, margin.top]);

            svg.selectAll(".backBar")
                .data(Object.keys(wholeAttributeStatItem))
                .enter()
                .append("rect")
                .attr("class", "backBar")
                .attr("x", function(d) {
                    return xScale(d);
                })
                .attr("width", xScale.bandwidth())
                .attr("y", d => yScale(wholeAttributeStatItem[d]))
                .attr("height", function(d) {
                    return (
                        height -
                        yScale(wholeAttributeStatItem[d]) -
                        margin.bottom
                    );
                })
                .attr("fill", item => {
                    if (d === highlightedDimension) {
                        return highlightColor(item);
                    } else {
                        return regularGreyDark;
                    }
                })
                .attr("opacity", 0.5);

            svg.selectAll(".frontBar")
                .data(Object.keys(wholeAttributeStatItem))
                .enter()
                .append("rect")
                .attr("class", "frontBar")
                .attr("x", function(d) {
                    return xScale(d);
                })
                .attr("width", xScale.bandwidth())
                .attr("y", d => yScale(attributeStatItem[d]))
                .attr("height", function(d) {
                    return (
                        height - yScale(attributeStatItem[d]) - margin.bottom
                    );
                })
                .attr("fill", item => {
                    if (d === highlightedDimension) {
                        return highlightColor(item);
                    } else {
                        return regularGreyDark;
                    }
                })
                .attr("opacity", 1);

            svg.append("g")
                .attr(
                    "transform",
                    "translate(0," +
                        (Number(height) - Number(margin.bottom)) +
                        ")"
                )
                .call(
                    d3.axisBottom(xScale).tickFormat(t => {
                        if (Object.keys(labels[d]["map"]).length > 9) {
                            return "";
                        }
                        if (
                            labels.hasOwnProperty(d) &&
                            labels[d].hasOwnProperty("map")
                        ) {
                            if (labels[d]["map"][t]) {
                                return labels[d]["map"][t].split(/\s|\//)[0];
                            }
                        }

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
                .call(d3.axisLeft(yScale).ticks(3));
        });
    }

    renderSvg(baseGroup, props) {
        let {
            canvasHeight,
            input,
            attributeList,
            brushSelectedCluster
        } = props;
        let w = this.state.canvasWidth;
        const tempDimensions = [...attributeList.selectedAttributes];
        const adjustHeight = tempDimensions.map(
            d => Object.keys(input.labels[d]["map"]).length
        );

        let h = d3.max(adjustHeight) > 6 ? canvasHeight * 1.5 : canvasHeight;
        const svgRoot = d3.select("#parallel-coordinates");
        svgRoot.style("height", h);
        let margin = { top: 130, right: 110, bottom: 10, left: 80 },
            width = w - margin.left - margin.right - 5,
            height = h - margin.top - margin.bottom;

        let x = d3.scalePoint().range([0, width]),
            y = {};

        let svg = baseGroup.attr(
            "transform",
            "translate(" + margin.left + "," + margin.top + ")"
        );

        let data = [];
        let wholeData = [];
        const highlightedDimension = attributeList.highlightedAttribute;
        let highlightColor = null;

        wholeData = Object.keys(input.nodes).map(key => input.nodes[key]);
        let similarGroup = {};
        let groupData = wholeData.filter(item => {
            return brushSelectedCluster.has(String(item.id));
        });

        let itemSetIDLists = new Set();
        Object.keys(input.nodes).forEach(node => {
            let itemSetID = "";
            tempDimensions.forEach((d, i) => {
                itemSetID += input["nodes"][node][d];
            });
            itemSetIDLists.add(itemSetID);
        });
        groupData.forEach(value => {
            let itemSetID = "";
            let itemSetList = [];
            let itemSetAttr = {};
            tempDimensions.forEach((d, i) => {
                itemSetID += value[d];
                itemSetAttr[d] = input.labels[d]["map"][value[d]];
            });
            if (similarGroup.hasOwnProperty(itemSetID)) {
                similarGroup[itemSetID].groupCount += 1;
            } else {
                similarGroup[itemSetID] = {
                    id: itemSetID,
                    name: itemSetList,
                    groupCount: 1
                };
                similarGroup[itemSetID] = Object.assign(
                    {},
                    similarGroup[itemSetID],
                    itemSetAttr
                );
            }
        });
        similarGroup = Object.values(similarGroup);
        similarGroup.sort((a, b) => {
            return b.groupCount - a.groupCount;
        });
        itemSetIDLists = [...itemSetIDLists].sort();
        const subgroupColor = d3
            .scaleOrdinal()
            .domain(itemSetIDLists)
            .range(subGroupColor);

        data = wholeData.filter(item => {
            return brushSelectedCluster.has(String(item.id));
        });

        if (
            Object.keys(input.labels).length > 0 &&
            highlightedDimension !== ""
        ) {
            if (
                input.labels[highlightedDimension]["feature_type"] ===
                "category"
            ) {
                highlightColor = d3
                    .scaleOrdinal()
                    .domain(
                        Object.keys(input.labels[highlightedDimension]["map"])
                    )
                    .range(attributeColor);
            } else {
                // console.log(d3.extent(data.map(d => d[highlightedDimension])));
                highlightColor = d3
                    .scaleSequential(
                        d3.extent(data => data[highlightedDimension])
                    )
                    .domain(d3.extent(data.map(d => d[highlightedDimension])))
                    .interpolator(d3.interpolatePuRd);
            }
        }

        // console.log(data);
        let dimWidth = 0;
        if (data.length !== 0) {
            let itemSetCount = {};
            const omitSet = new Set(["x", "y", "sim_x", "sim_y", "id"]);
            // console.log(Object.keys(data[0]))
            const dimensions = tempDimensions;
            // console.log(dimensions);

            data.forEach(dataItem => {
                let itemSetKey = "";
                for (let i = 0; i < dimensions.length; i++) {
                    if (i === dimensions.length - 1) {
                        itemSetKey += dataItem[dimensions[i]].toString();
                    } else {
                        itemSetKey += dataItem[dimensions[i]].toString() + "~";
                    }
                }
                if (itemSetKey in itemSetCount) {
                    itemSetCount[itemSetKey]++;
                } else {
                    itemSetCount[itemSetKey] = 1;
                }
            });

            console.log(itemSetCount);
            let prefix = 0;
            const totalLen = Object.values(itemSetCount).reduce(
                (accumulator, currentValue) => accumulator + currentValue
            );
            const oneDimScale = {};
            Object.keys(itemSetCount).forEach(key => {
                const y = prefix;
                prefix += (itemSetCount[key] / totalLen) * height + 5;
                oneDimScale[key] = {
                    y: y,
                    height: (itemSetCount[key] / totalLen) * height
                };
            });
            console.log(oneDimScale);
            let index = -1;
            const nodes = [];
            const nodeByKey = new Map();
            const indexByKey = new Map();
            const links = [];

            for (const k of dimensions) {
                for (const d of data) {
                    const key = JSON.stringify([k, d[k]]);
                    if (nodeByKey.has(key)) continue;
                    const node = {
                        name: d[k],
                        title: input.labels[k]["map"][d[k]]
                    };
                    nodes.push(node);
                    nodeByKey.set(key, node);
                    indexByKey.set(key, ++index);
                }
            }

            for (let i = 1; i < dimensions.length; ++i) {
                const a = dimensions[i - 1];
                const b = dimensions[i];
                const prefix = dimensions.slice(0, i + 1);
                const linkByKey = new Map();
                for (const d of data) {
                    const names = prefix.map(k => d[k]);
                    const key = JSON.stringify(names);
                    const value = d.value || 1;
                    let link = linkByKey.get(key);
                    if (link) {
                        link.value += value;
                        continue;
                    }
                    link = {
                        source: indexByKey.get(JSON.stringify([a, d[a]])),
                        target: indexByKey.get(JSON.stringify([b, d[b]])),
                        names,
                        value
                    };
                    links.push(link);
                    linkByKey.set(key, link);
                }
            }
            console.log(nodes);
            console.log(links);

            let sankey = d3
                .sankey()
                .nodeWidth(dimWidth)
                .nodePadding(20)
                .extent([
                    [0, 5],
                    [width, height - 5]
                ]);

            const graph = sankey({
                nodes: nodes.map(d => Object.assign({}, d)),
                links: links.map(d => Object.assign({}, d))
            });
            console.log(graph);
            // console.log(graph)
            // console.log(linksData)
            svg.append("g")
                .selectAll("rect")
                .data(graph.nodes)
                .join("rect")
                .attr("rx", "5")
                .attr("ry", "5")
                .attr("x", d => {
                    if (isNaN(d.x0)) {
                        return width / 2;
                    }
                    return d.x0;
                })
                .attr("y", d => {
                    if (isNaN(d.x0)) {
                        return oneDimScale[d.name].y;
                    }
                    return d.y0;
                })
                .attr("height", d => {
                    if (isNaN(d.x0)) {
                        return oneDimScale[d.name].height;
                    }
                    return d.y1 - d.y0;
                })
                .attr("width", d => 3)
                .attr("fill", "black");
            // .append("title")
            // .text(d => `${d.name}\n${d.value.toLocaleString()}`);

            svg.append("g")
                .attr("fill", "none")
                .selectAll("g")
                .data(graph.links)
                .join("path")
                .attr("class", d => {
                    let className = "";
                    const selectedAttributes = [
                        ...attributeList.selectedAttributes
                    ];
                    d.names.forEach((g, i) => {
                        className += selectedAttributes[i] + "~~" + g + " ";
                    });
                    // console.log(className);
                    return className;
                })
                .attr("d", d3.sankeyLinkHorizontal())
                .attr("stroke", d => {
                    // if (
                    //     index >= d.names.length ||
                    //     highlightedDimension === ""
                    // ) {
                    //     return regularGreyDark;
                    // }
                    let groupID = "";
                    d.names.forEach(g => {
                        groupID += g;
                    });
                    return subgroupColor(groupID);
                })
                .attr("opacity", 0.7)
                .attr("stroke-width", d => d.width)
                .style("mix-blend-mode", "multiply");
            // .append("title")
            // .text(d => `${d.names.join(" → ")}\n${d.value.toLocaleString()}`);

            svg.append("g")
                .style("font", "10px sans-serif")
                .selectAll("text")
                .data(graph.nodes)
                .join("text")
                .attr("font-size", "0.8rem")
                .attr("x", d => {
                    if (isNaN(d.x0)) {
                        return width / 2 - 6;
                    }
                    return d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6;
                })
                .attr("y", d => {
                    if (isNaN(d.x0)) {
                        return (
                            oneDimScale[d.name].y +
                            oneDimScale[d.name].height / 2
                        );
                    }
                    return (d.y1 + d.y0) / 2;
                })
                .attr("dy", "0.35em")
                .attr("text-anchor", d => (d.x0 < width / 2 ? "start" : "end"))
                .text(
                    d =>
                        d.title +
                        " (" +
                        ((d.value * 100) / groupData.length).toFixed(2) +
                        "%)"
                )
                .append("tspan")
                .attr("fill-opacity", 0.7);
            // .text(d => ` ${d.value.toLocaleString()}`);
        }

        // Extract the list of dimensions and create a scale for each.
        const dimensions = d3.keys(data[0]).filter(function(d) {
            let oneDimension = data.map(p => Number(p[d]));
            oneDimension.sort((a, b) => b - a);
            return (
                d !== "x" &&
                d !== "y" &&
                d !== "sim_x" &&
                d !== "sim_y" &&
                attributeList.selectedAttributes.has(d) &&
                (y[d] = d3
                    .scalePoint()
                    .domain(oneDimension)
                    .range([height, 0]))
            );
        });
        x.domain(dimensions);

        // Add a group element for each dimension.
        let g = svg
            .selectAll(".dimension")
            .data(dimensions)
            .enter()
            .append("g")
            .attr("class", "dimension")
            .attr("transform", function(d) {
                return "translate(" + x(d) + ")";
            });
        //
        // Add an axis and title.
        const axisGroup = g.append("g").attr("class", "axis");

        axisGroup
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -12)
            .attr("fill", textGrey)
            .attr("font-size", "0.9rem")
            //   .attr("dy", "0.5em")
            .text(function(d) {
                //   console.log(d);
                return d;
            });

        g.append("g")
            .attr("class", "attributeStat")
            .attr("transform", "translate(-75,-130)")
            .attr("id", d => "attribute-stat-" + d);

        this.renderStat(
            dimensions,
            data,
            Array.from(wholeData),
            input["labels"],
            highlightColor,
            highlightedDimension
        );
    }

    /**
     * Entry point
     * @returns None
     */
    initializeCanvas() {
        const baseGroup = d3.select("#parallel-coordinates-base");
        this.renderSvg(baseGroup, this.props);

        baseGroup.raise();
    }

    /***
     * When updating the props, according canvas needs to be updated.
     * Remove original canvas and draw a new one.
     * @param props {Object} from React.Component
     */
    updateCanvas(props) {
        const svgRoot = d3.select("#parallel-coordinates");
        svgRoot.style("width", this.state.canvasWidth);
        let baseGroup = d3
            .select("#parallel-coordinates")
            .select("#parallel-coordinates-base");
        baseGroup.remove();
        // baseGroup = d3.select("#kldivergence-base").remove();
        // d3.select("#kldivergence").append("g").attr("id", "kldivergence-base");
        baseGroup = svgRoot.append("g").attr("id", "parallel-coordinates-base");
        this.renderSvg(baseGroup, props);
    }

    render() {
        const { canvasHeight } = this.props;
        const svgID = "parallel-coordinates";
        const svgIDBase = "parallel-coordinates-base";
        return (
            <div ref={this.container}>
                <svg
                    id={svgID}
                    style={{
                        height: canvasHeight,
                        width: this.state.canvasWidth
                    }}
                >
                    <g
                        id={svgIDBase}
                        style={{ height: "100%", width: "100%" }}
                    />
                </svg>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ParallelSetView);
