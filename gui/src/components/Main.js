import React from "react";
import * as d3 from "d3";
// import MultipleSelect from "./MultipleSelect";
import { connect } from "react-redux";
import { getData } from "../actions";
import {
    Layout,
    Row,
    Col,
    Slider,
    InputNumber,
    Divider,
    Button,
    Dropdown,
    Menu,
    Select,
    Card
} from "antd";
import { Typography, Space } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import {
    updatePairwiseCommonAttributes,
    updateSelectedCluster
} from "../actions";
import "antd/dist/antd.css";
import MiningResultDensity from "./MiningResultDensity";
import RankMappingView from "./RankMappingView";
import ParallelSetView from "./ParallelSetView";
import KLDivergenceView from "./KLDivergenceView";
import MultipleSelect from "./MultipleSelect";
import SubgroupTable from "./SubgroupTable";
import ProportionView from "./ProportionView";
import GroupShiftingView from "./GroupShiftingView";
import GroupShiftingViewNew from "./GroupShiftingViewNew";
const { Title, Text } = Typography;
const { Option } = Select;

// import MiningResultDensity from "./MiningResultDensity";
// import KLDivergenceView from "./KLDivergenceView";
// import ParallelSetView from "./ParallelSetView";
// import RankMappingView from "./RankMappingView";
// import SubgroupTable from "./SubgroupTable";

const mapStateToProps = state => {
    return {
        clusterSliderUI: state.ui.clusterSliderUI,
        output: state.output,
        input: state.input,
        dataName: state.dataName,
        clusterList: state.ui.clusterList,
        individualSim: state.individualSim,
        brushSelectedCluster: state.brushSelectedCluster,
        pairwiseAttribute: state.pairwiseAttribute,
        attributeList: state.ui.attributeList
    };
};

class Main extends React.Component {
    componentDidMount() {
        this.props.getData();
    }

    constructor(props) {
        super(props);
        this.state = {
            tool: "zoom",
            displayEdges: true,
            tabIndex: 0,
            miningResultControl: "zoom",
            openRankingDensitySettings: false
        };
    }

    render() {
        const {
            classes,
            globalHeight,
            clusterSliderUI,
            updateClusterSliderValue,
            output,
            input,
            updateHighlightedAttribute,
            dataName,
            brushSelectedCluster,
            attributeList
        } = this.props;

        let attributes = [];
        const data = Object.keys(input.nodes).map(key => input.nodes[key]);
        if (data.length > 0) {
            attributes = Object.keys(data[0])
                .filter(d => {
                    return (
                        d !== "id" &&
                        d !== "x" &&
                        d !== "y" &&
                        d !== "sim_x" &&
                        d !== "sim_y"
                    );
                })
                .map(key => {
                    return (
                        <Option key={key} value={key}>
                            {key}
                        </Option>
                    );
                });
        }

        const selectedNodes = Object.keys(input.nodes).filter(key =>
            brushSelectedCluster.has(key)
        );
        const selectedEdges = Object.keys(input.edges).filter(
            edge =>
                brushSelectedCluster.has(String(edge.source)) &&
                brushSelectedCluster.has(String(edge.target))
        );

        const selectedMiningResult = d3.extent(
            selectedNodes.map(key => output.res[key].res)
        );

        //TODO: remove this
        let rank = Object.keys(output["res"]);
        rank.sort((a, b) => output["res"][b]["res"] - output["res"][a]["res"]);

        let rankMap = {};
        rank.forEach((r, i) => {
            rankMap[output["res"][r]["res"]] = i + 1;
        });
        // console.log(rankMap);

        let miningResultDensity;
        if (Object.keys(output.res).length !== 0) {
            miningResultDensity = (
                <React.Fragment>
                    <Text strong>Ranking range:</Text>
                    <br />
                    <Row justify="space-between">
                        <Col span={5}>
                            <InputNumber
                                min={0}
                                max={Object.keys(output.res).length}
                                style={{ width: "60px" }}
                                value={
                                    selectedMiningResult[0] !== undefined
                                        ? Number(
                                              rankMap[selectedMiningResult[1]]
                                          )
                                        : -1
                                }
                                onChange={() => {}}
                            />
                        </Col>
                        <Col span={12}>
                            <Slider
                                min={0}
                                max={Object.keys(output.res).length}
                                onChange={() => {}}
                                value={[
                                    rankMap[selectedMiningResult[0]],
                                    rankMap[selectedMiningResult[1]]
                                ]}
                                // range={{ draggableTrack: true }}
                                range
                            />
                        </Col>
                        <Col span={5}>
                            <InputNumber
                                min={0}
                                max={Object.keys(output.res).length}
                                style={{ width: "60px" }}
                                value={
                                    selectedMiningResult[0] !== undefined
                                        ? Number(
                                              rankMap[selectedMiningResult[0]]
                                          )
                                        : -1
                                }
                                onChange={() => {}}
                            />
                        </Col>
                    </Row>
                </React.Fragment>
            );
        }

        const setting = (
            <Menu>
                <Menu.Item>
                    <Row justify="space-around">
                        <Col span={5}>
                            <Text># of bins</Text>
                        </Col>
                        <Col span={11}>
                            <Slider
                                min={clusterSliderUI.minValue}
                                max={clusterSliderUI.maxValue}
                                onChange={updateClusterSliderValue}
                                value={clusterSliderUI.value}
                            />
                        </Col>
                        <Col span={8}>
                            <InputNumber
                                min={clusterSliderUI.minValue}
                                max={clusterSliderUI.maxValue}
                                value={
                                    clusterSliderUI.value !== undefined
                                        ? clusterSliderUI.value
                                        : -1
                                }
                                onChange={updateClusterSliderValue}
                            />
                        </Col>
                    </Row>
                </Menu.Item>
            </Menu>
        );

        return (
            <React.Fragment>
                <Layout style={{ padding: 16 }}>
                    <Row
                        justify="space-around"
                        gutter={16}
                        style={{ marginBottom: 16 }}
                    >
                        <Col span={5}>
                            <Card size="small" title="Data Setting">
                                <div style={{ padding: 16 }}>
                                    <Text strong>
                                        {"Dataset: " + dataName + " "}
                                    </Text>
                                    <Text>
                                        {Object.keys(input.nodes).length +
                                            " nodes, " +
                                            Object.keys(input.edges).length +
                                            " edges"}
                                    </Text>
                                    <Divider
                                        style={{
                                            marginTop: "8px",
                                            marginBottom: "8px"
                                        }}
                                    />
                                    <Row>
                                        <Col span={15}>
                                            <Text strong>
                                                Ranking Score Density
                                            </Text>
                                        </Col>
                                        <Col span={8}>
                                            <Dropdown
                                                overlay={setting}
                                                placement="bottomLeft"
                                            >
                                                <SettingOutlined />
                                            </Dropdown>
                                        </Col>
                                    </Row>

                                    <MiningResultDensity
                                        canvasHeight={globalHeight * 0.16}
                                        miningResultControl={
                                            this.state.miningResultControl
                                        }
                                    />
                                    <br />
                                    {miningResultDensity}
                                    <Divider
                                        style={{
                                            marginTop: "8px",
                                            marginBottom: "8px"
                                        }}
                                    />
                                    <Text strong> Selected Data: </Text>
                                    <Text>
                                        {selectedNodes.length +
                                            " nodes, " +
                                            selectedEdges.length +
                                            " edges"}
                                    </Text>
                                    <br />
                                    <Text strong>Mining Result Range:</Text>
                                    <Text>
                                        {" " +
                                            (selectedMiningResult[0] !==
                                            undefined
                                                ? selectedMiningResult[0].toFixed(
                                                      6
                                                  ) +
                                                  " ~ " +
                                                  selectedMiningResult[1].toFixed(
                                                      6
                                                  )
                                                : "null")}
                                    </Text>
                                </div>
                            </Card>
                        </Col>
                        <Col span={14}>
                            <Card size="small" title="Attributes View">
                                <ParallelSetView
                                    canvasHeight={globalHeight * 0.37}
                                />
                            </Card>
                        </Col>
                        <Col span={5}>
                            <Card size="small" title="Attributes Setting">
                                <div style={{ padding: 16 }}>
                                    <Row>
                                        <Col span={10}>
                                            <Text strong>
                                                Highlight Attribute
                                            </Text>
                                        </Col>
                                        <Col span={14}>
                                            <Select
                                                onChange={
                                                    updateHighlightedAttribute
                                                }
                                                style={{ width: "100%" }}
                                                value={
                                                    attributeList.highlightedAttribute
                                                }
                                            >
                                                <Option key="none" value="">
                                                    none
                                                </Option>
                                                {attributes}
                                            </Select>
                                        </Col>
                                    </Row>
                                    <br />
                                    <Row>
                                        <Col span={10}>
                                            <Text strong>Attributes</Text>
                                        </Col>
                                        <Col span={14}>
                                            <MultipleSelect />
                                        </Col>
                                    </Row>

                                    <Divider
                                        style={{
                                            marginTop: "8px",
                                            marginBottom: "8px"
                                        }}
                                    />
                                    <Text strong>KL Divergence</Text>
                                    <KLDivergenceView
                                        canvasHeight={globalHeight * 0.22}
                                        canvasWidth={300}
                                    />
                                </div>
                            </Card>
                        </Col>
                    </Row>
                    <Row justify="space-around" gutter={16}>
                        <Col span={6}>
                            <Card size="small" title="Subgroup Table">
                                <SubgroupTable
                                    canvasHeight={globalHeight * 0.42}
                                />
                            </Card>
                        </Col>
                        <Col span={18}>
                            <Card size="small" title="Rank Mapping View">
                                <Row>
                                    <Col span={16}>

                                        <RankMappingView
                                            svgID={"rank-mapping"}
                                            canvasHeight={globalHeight * 0.45}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <Text strong>Group Proportion</Text>
                                        <ProportionView
                                            svgID={"proportion"}
                                            canvasHeight={globalHeight * 0.1}
                                        />
                                        <Text strong>Group Shift</Text>
                                        <GroupShiftingViewNew />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>
                </Layout>
            </React.Fragment>
        );
    }
}

export default connect(mapStateToProps, { getData })(Main);
