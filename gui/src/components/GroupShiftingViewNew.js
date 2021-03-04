import * as React from "react";
import * as d3 from "d3";
import { connect } from "react-redux";
import { regularGreyDark } from "../constants/colorScheme";
import { Row, Col, List, Space } from "antd";
import IndividualGroupShift from "./IndividualGroupShift";
import IndividualGroupDistribution from "./IndividualGroupDistribution";
import Text from "antd/es/typography/Text";

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

class GroupShiftingView extends React.Component {
    constructor(props) {
        super(props);
        this.container = React.createRef();
    }

    // componentDidMount() {
    //     // this.initializeCanvas();
    // }
    //
    // shouldComponentUpdate(nextProps) {
    //     return true;
    // }
    //
    // componentWillReceiveProps(nextProps, nextContext) {
    //     this.updateCanvas(nextProps);
    // }
    //
    // renderSvg(props) {
    //     let {
    //         svgID,
    //         canvasHeight,
    //         input,
    //         output,
    //         clusterSliderUI,
    //         attributeList,
    //         brushSelectedCluster,
    //         modelName,
    //         individualSim
    //     } = props;
    //
    //     /***
    //      * Terminate rendering condition
    //      */
    //     if (brushSelectedCluster.size === 0) return;
    //
    //     /***
    //      * Canvas setup
    //      */
    //     const height = canvasHeight;
    //     const width = this.container.current.getBoundingClientRect().width;
    //     const svgRoot = d3.select("#" + svgID);
    //     svgRoot.style("width", width);
    //     const svgBase = svgRoot.select("g");
    //     const margin = { top: 10, right: 20, bottom: 20, left: 30 };
    //
    //     /***
    //      * Data processing
    //      */
    //     const data = {};
    //     const nodeResKey = Object.keys(output["res"]);
    //     const selectedNodes = nodeResKey.filter(item => {
    //         return brushSelectedCluster.has(String(item));
    //     });
    //     const dimensions = [...attributeList.selectedAttributes];
    //     selectedNodes.forEach(node => {
    //         let itemSetID = "";
    //         dimensions.forEach(d => {
    //             itemSetID += input["nodes"][node][d];
    //         });
    //         if (!data.hasOwnProperty(itemSetID)) {
    //             data[itemSetID] = {
    //                 id: itemSetID,
    //                 value: 0,
    //                 count: 0
    //             };
    //         }
    //         data[itemSetID]["value"] +=
    //             input["topological_feature"]["pagerank"][node]["rank"] -
    //             output["res"][node]["rank"];
    //
    //         data[itemSetID]["count"]++;
    //     });
    //
    //     console.log(data);
    //
    //     const statData = Object.values(data);
    //
    //     let subgroupIDs = Object.keys(data);
    //     subgroupIDs.sort((a, b) => data[b]["count"] - data[a]["count"]);
    //
    //     const nodeColor = d3
    //         .scaleOrdinal()
    //         .domain(subgroupIDs)
    //         .range(d3.schemeTableau10);
    //
    //     const statXScale = d3
    //         .scaleBand()
    //         .domain(statData.map(x => x.id))
    //         .range([margin.left, width - margin.right]);
    //
    //     const statYScale = d3
    //         .scaleLinear()
    //         .domain(d3.extent(statData.map(x => x.value / x.count)))
    //         .range([height - margin.bottom, margin.top]);
    //
    //     const detailView = svgBase.append("g").attr("class", "detail");
    //
    //     detailView
    //         .selectAll("rect")
    //         .data(statData)
    //         .join("rect")
    //         .attr("x", d => statXScale(d.id))
    //         .attr("y", d => {
    //             if (d.value >= 0) {
    //                 return statYScale(d.value / d.count);
    //             } else {
    //                 return statYScale(0);
    //             }
    //         })
    //         .attr("width", statXScale.bandwidth())
    //         .attr("height", d => {
    //             if (d.value >= 0) {
    //                 return statYScale(0) - statYScale(d.value / d.count);
    //             } else {
    //                 return statYScale(d.value / d.count) - statYScale(0);
    //             }
    //         })
    //         .attr("fill", d => nodeColor(d.id))
    //         .attr("opacity", 0.5)
    //         .append("title")
    //         .text(d => (d.value / d.count).toFixed(2));
    //
    //     detailView
    //         .append("g")
    //         .attr("transform", "translate(0," + statYScale(0) + ")")
    //         .call(d3.axisBottom(statXScale));
    //
    //     detailView
    //         .append("g")
    //         .attr("transform", "translate(" + margin.left + ",0)")
    //         .call(d3.axisLeft(statYScale));
    // }
    //
    // /**
    //  * Entry point
    //  * @returns None
    //  */
    // initializeCanvas() {
    //     this.renderSvg(this.props);
    // }
    //
    // /***
    //  * When updating the props, according canvas needs to be updated.
    //  * Remove original canvas and draw a new one.
    //  * @param props {Object} from React.Component
    //  */
    // updateCanvas(props) {
    //     const { svgID } = props;
    //     const svgRoot = d3.select("#" + svgID);
    //     svgRoot.select("g").remove();
    //     svgRoot.append("g").attr("id", svgID + "-base");
    //     this.renderSvg(props);
    // }

    render() {
        const {
            svgID,
            canvasHeight,
            input,
            output,
            brushSelectedCluster,
            attributeList
        } = this.props;

        // return (
        //     <div ref={this.container}>
        //         <svg id={svgID} height={canvasHeight}>
        //             <g id={svgID + "-base"} height="100%" width="100%" />
        //         </svg>
        //     </div>
        // );
        const data = {};
        const nodeResKey = Object.keys(output["res"]);
        const selectedNodes = nodeResKey.filter(item => {
            return brushSelectedCluster.has(String(item));
        });
        const dimensions = [...attributeList.selectedAttributes];
        selectedNodes.forEach(node => {
            let itemSetID = "";
            dimensions.forEach(d => {
                itemSetID += input["nodes"][node][d];
            });
            if (!data.hasOwnProperty(itemSetID)) {
                data[itemSetID] = {
                    id: itemSetID,
                    value: 0,
                    count: 0
                };
            }
            data[itemSetID]["value"] +=
                input["topological_feature"]["pagerank"][node]["rank"] -
                output["res"][node]["rank"];

            data[itemSetID]["count"]++;
        });

        console.log(data);
        const statData = Object.values(data);
        let subgroupIDs = Object.keys(data);

        subgroupIDs.sort((a, b) => data[b]["count"] - data[a]["count"]);
        const nodeColor = d3
            .scaleOrdinal()
            .domain(subgroupIDs)
            .range(d3.schemeTableau10);

        const extent = d3.extent(statData.map(x => x.value / x.count));

        return (
            <List
                size="small"
                style={{ height: canvasHeight, overflow: "auto" }}
                dataSource={Object.keys(data)}
                header={
                    <Space>
                        <Text strong>Group ID & Group Shifting</Text>{" "}
                        <Text strong> Distribution Changes</Text>
                    </Space>
                }
                renderItem={item => (
                    <List.Item>
                        <Row style={{ width: "100%" }}>
                            <Col span={10}>
                                <Text strong> {item}</Text>
                                <IndividualGroupShift
                                    svgID={"igs-" + item}
                                    canvasHeight={"100"}
                                    data={data[item]}
                                    extent={extent}
                                    nodeColor={nodeColor}
                                />
                            </Col>
                            <Col span={14}>
                                <IndividualGroupDistribution
                                    svgID={"igd-" + item}
                                    canvasHeight={"100"}
                                    groupID={item}
                                    extent={extent}
                                    nodeColor={nodeColor}
                                />
                            </Col>
                        </Row>
                    </List.Item>
                )}
            />
        );
    }
}

export default connect(mapStateToProps)(GroupShiftingView);
