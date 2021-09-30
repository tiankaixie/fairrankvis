import * as React from "react";
import * as d3 from "d3";
import { connect } from "react-redux";
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

    render() {
        const {
            canvasHeight,
            input,
            output,
            brushSelectedCluster,
            attributeList,
            nodeColor
        } = this.props;

        const data = {};
        const nodeResKey = Object.keys(output["res"]);
        const selectedNodes = nodeResKey.filter(item => {
            return brushSelectedCluster.has(String(item));
        });
        const dimensions = [...attributeList.selectedAttributes];
        let itemSetIDLists = new Set();

        const rankBound = d3.extent(
            selectedNodes.map(node => output["res"][node]["rank"])
        );

        const inputSelectedNodes = [];
        Object.keys(input.nodes).forEach(node => {
            let itemSetID = "";
            dimensions.forEach((d, i) => {
                itemSetID += input["nodes"][node][d];
            });
            itemSetIDLists.add(itemSetID);
            const rank = input["topological_feature"]["pagerank"][node]["rank"];
            if (rank >= rankBound[0] && rank <= rankBound[1]) {
                inputSelectedNodes.push(node);
            }
        });

        const commonNodes = [
            ...new Set([...inputSelectedNodes, ...selectedNodes])
        ];
        // console.log(commonNodes);

        commonNodes.forEach(node => {
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
        itemSetIDLists = [...itemSetIDLists].sort();
        // const nodeColor = d3
        //     .scaleOrdinal()
        //     .domain(itemSetIDLists)
        //     .range(subGroupColor);

        const extent = d3.extent(statData.map(x => x.value / x.count));
        // console.log(extent)
        return (
            <List
                size="small"
                style={{ height: canvasHeight, overflowY: "scroll" }}
                dataSource={Object.keys(data)}
                header={
                    <Space>
                        <Text>Group ID & Group Shifting</Text>{" "}
                        <Text> Distribution Changes</Text>
                    </Space>
                }
                renderItem={item => (
                    <List.Item>
                        <Row style={{ width: "100%" }}>
                            <Col span={10}>
                                <Text>Group ID: {item}</Text>
                                <IndividualGroupShift
                                    svgID={"igs-" + item}
                                    canvasHeight={"110"}
                                    data={data[item]}
                                    extent={extent}
                                    nodeColor={nodeColor}
                                />
                            </Col>
                            <Col span={14}>
                                <IndividualGroupDistribution
                                    svgID={"igd-" + item}
                                    canvasHeight={"110"}
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
