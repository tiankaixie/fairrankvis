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
import { Typography } from "antd";
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

    constructor() {
        super();
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
                    <Title level={5}>Ranking range:</Title>
                    <Row>
                        <Col span={6}>
                            <InputNumber
                                min={clusterSliderUI.minValue}
                                max={clusterSliderUI.maxValue}
                                // style={{ margin: "0 16px" }}
                                value={
                                    selectedMiningResult[0] !== undefined
                                        ? rankMap[selectedMiningResult[1]]
                                        : -1
                                }
                                onChange={() => {}}
                            />
                        </Col>
                        <Col span={12}>
                            <Slider
                                min={1}
                                max={20}
                                onChange={this.onChange}
                                value={selectedMiningResult}
                                range={{ draggableTrack: true }}
                                defaultValue={[0, 0]}
                            />
                        </Col>
                        <Col span={6}>
                            <InputNumber
                                min={clusterSliderUI.minValue}
                                max={clusterSliderUI.maxValue}
                                // style={{ margin: "0 16px" }}
                                value={
                                    selectedMiningResult[0] !== undefined
                                        ? rankMap[selectedMiningResult[1]]
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
                    <Row>
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
                                style={{ margin: "0 16px" }}
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
                <Layout>
                    <Row>
                        <Col span={5}>
                            <Card size="small" title="Data Setting">
                                <Text>{"Dataset: " + dataName}</Text>
                                <Text>
                                    {Object.keys(input.nodes).length +
                                        " nodes, " +
                                        Object.keys(input.edges).length +
                                        " edges"}
                                </Text>
                                <Divider />
                                <Title level={5}>Ranking Score Density</Title>
                                <Dropdown
                                    overlay={setting}
                                    placement="bottomLeft"
                                >
                                    <SettingOutlined />
                                </Dropdown>
                                <MiningResultDensity
                                    canvasHeight={globalHeight * 0.16}
                                    miningResultControl={
                                        this.state.miningResultControl
                                    }
                                />
                                {miningResultDensity}
                                <Divider />
                                <Title level={5}>Selected Data</Title>
                                <Text>
                                    {selectedNodes.length +
                                        " nodes, " +
                                        selectedEdges.length +
                                        " edges"}
                                </Text>
                                <Text>
                                    {"Mining Result Range: " +
                                        (selectedMiningResult[0] !== undefined
                                            ? selectedMiningResult[0].toFixed(
                                                  6
                                              ) +
                                              " ~ " +
                                              selectedMiningResult[1].toFixed(6)
                                            : "null")}
                                </Text>
                            </Card>
                        </Col>
                        <Col span={14}>
                            <Card size="small" title="Attributes View">
                                <ParallelSetView
                                    canvasHeight={globalHeight * 0.42}
                                />
                            </Card>
                        </Col>
                        <Col span={5}>
                            <Card size="small" title="Attributes Setting">
                                <Row>
                                    <Col span={12}>
                                        <Text>Sensitive Attributes</Text>
                                    </Col>
                                    <Col span={12}>
                                        <Select
                                            onChange={
                                                updateHighlightedAttribute
                                            }
                                            style={{ width: "100%" }}
                                        >
                                            <Option key="none" value="">
                                                none
                                            </Option>
                                            {attributes}
                                        </Select>
                                    </Col>
                                </Row>

                                {/*<MultipleSelect />*/}
                                <Divider />
                                <Title level={5}>KL Divergence</Title>
                                <KLDivergenceView
                                    canvasHeight={globalHeight * 0.25}
                                    canvasWidth={300}
                                />
                            </Card>
                        </Col>
                    </Row>
                    <Row gutter={8}>
                        <Col span={9}>
                            <Card size="small" title="Subgroup Table">
                                {/*<SubgroupTable />*/}
                            </Card>
                        </Col>
                        <Col span={15}>
                            <Card size="small" title="Rank Mapping View">
                                <RankMappingView
                                    svgID={"rank-mapping"}
                                    canvasHeight={globalHeight * 0.45}
                                />
                            </Card>
                        </Col>
                    </Row>
                </Layout>
            </React.Fragment>
        );
    }
}

export default connect(mapStateToProps, { getData })(Main);
