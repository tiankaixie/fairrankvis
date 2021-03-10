import React from "react";
import * as d3 from "d3";
import { connect } from "react-redux";
import {
    getData,
    updateClusterSliderValue,
    updateHighlightedAttribute
} from "../actions";
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
    Card,
    Switch,
    Space
} from "antd";
import { Typography } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import "antd/dist/antd.css";
import MiningResultDensity from "./MiningResultDensity";
import RankMappingView from "./RankMappingView";
import ParallelSetView from "./ParallelSetView";
import KLDivergenceView from "./KLDivergenceView";
import MultipleSelect from "./MultipleSelect";
import SubgroupTable from "./SubgroupTable";
import {
    updatePairwiseCommonAttributes,
    updateSelectedCluster,
    updateBrushClusterSelected
} from "../actions";
import GroupShiftingViewNew from "./GroupShiftingViewNew";
import ProportionViewNew from "./ProportionViewNew";
const { Title, Text } = Typography;
const { Option } = Select;

const mapStateToProps = state => {
    return {
        clusterSliderUI: state.ui.clusterSliderUI,
        output: state.output,
        input: state.input,
        modelName: state.modelName,
        dataName: state.dataName,
        clusterList: state.ui.clusterList,
        individualSim: state.individualSim,
        brushSelectedCluster: state.brushSelectedCluster,
        pairwiseAttribute: state.pairwiseAttribute,
        attributeList: state.ui.attributeList
    };
};

const mapDispatchToProps = dispatch => {
    return {
        updateHighlightedAttribute: value =>
            dispatch(updateHighlightedAttribute(value)),
        updateBrushClusterSelected: newValue =>
            dispatch(updateBrushClusterSelected(newValue)),
        updateClusterSliderValue: newValue =>
            dispatch(updateClusterSliderValue(newValue))
    };
};

class Main extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tool: "zoom",
            displayEdges: true,
            tabIndex: 0,
            miningResultControl: "zoom",
            openRankingDensitySettings: false,
            comparisonMode: false,
            showDisadvantagedNode: false,
            showAdvantagedNode: false,
            highlightAttribute: true
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
            modelName,
            brushSelectedCluster,
            updateBrushClusterSelected
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

        selectedNodes.sort(
            (a, b) => output["res"][a]["rank"] - output["res"][b]["rank"]
        );

        const leftRank =
            selectedNodes.length > 0
                ? output["res"][selectedNodes[0]]["rank"]
                : 0;
        const rightRank =
            selectedNodes.length > 0
                ? output["res"][selectedNodes[selectedNodes.length - 1]]["rank"]
                : 0;
        const updateSelectedClusterHelper = (left, right) => {
            const filteredNodes = Object.keys(input.nodes).filter(
                key =>
                    output["res"][key]["rank"] >= left &&
                    output["res"][key]["rank"] <= right
            );
            updateBrushClusterSelected(new Set(filteredNodes));
        };
        let miningResultDensity;
        if (Object.keys(output.res).length !== 0) {
            miningResultDensity = (
                <React.Fragment>
                    <Text strong>Ranking range:</Text>
                    <br />
                    <br />
                    <div>
                        <Row justify="space-between">
                            <Col span={5}>
                                <InputNumber
                                    min={0}
                                    max={Object.keys(output.res).length}
                                    style={{ width: "60px" }}
                                    value={leftRank}
                                    onChange={newValue => {
                                        updateSelectedClusterHelper(
                                            newValue,
                                            rightRank
                                        );
                                    }}
                                />
                            </Col>
                            <Col span={12}>
                                <Slider
                                    min={0}
                                    max={Object.keys(output.res).length}
                                    onChange={() => {}}
                                    value={
                                        selectedMiningResult[0] !== undefined
                                            ? [leftRank, rightRank]
                                            : [0, 0]
                                    }
                                    // range={{ draggableTrack: true }}
                                    range
                                />
                            </Col>
                            <Col span={5}>
                                <InputNumber
                                    min={0}
                                    max={Object.keys(output.res).length}
                                    style={{ width: "60px" }}
                                    value={rightRank}
                                    onChange={newValue => {
                                        updateSelectedClusterHelper(
                                            leftRank,
                                            newValue
                                        );
                                    }}
                                />
                            </Col>
                        </Row>
                    </div>
                </React.Fragment>
            );
        }

        const setting = (
            <Menu>
                <Menu.Item>
                    <Space>
                        <Text># of bins</Text>

                        <Slider
                            style={{ width: "100px" }}
                            min={clusterSliderUI.minValue}
                            max={clusterSliderUI.maxValue}
                            onChange={updateClusterSliderValue}
                            value={clusterSliderUI.value}
                        />

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
                    </Space>
                </Menu.Item>
            </Menu>
        );

        return (
            <React.Fragment>
                <Layout style={{ padding: 16 }}>
                    <Row gutter={16} justify="space-around">
                        <Col span={6}>
                            <Card size="small" title="Data Setting">
                                <div
                                    style={{
                                        paddingLeft: 16,
                                        paddingRight: 16
                                    }}
                                >
                                    <Row>
                                        <Col span={11}>
                                            <Text strong>Dataset</Text>
                                        </Col>
                                        <Col span={13}>
                                            <Select
                                                onChange={() => {}}
                                                style={{
                                                    width: "100%"
                                                }}
                                                value={dataName}
                                            >
                                                <Option
                                                    key="facebook"
                                                    value="facebook"
                                                >
                                                    Facebook
                                                </Option>
                                                <Option
                                                    key="weibo"
                                                    value="weibo"
                                                >
                                                    Weibo
                                                </Option>
                                            </Select>
                                        </Col>
                                    </Row>
                                    <br />
                                    <Row>
                                        <Col span={11}>
                                            <Text strong>
                                                {"Ranking Model"}
                                            </Text>
                                        </Col>
                                        <Col span={13}>
                                            <Select
                                                onChange={() => {}}
                                                style={{
                                                    width: "100%"
                                                }}
                                                value={modelName}
                                            >
                                                <Option
                                                    key="attrirank"
                                                    value="attrirank"
                                                >
                                                    Attrirank
                                                </Option>
                                            </Select>
                                        </Col>
                                    </Row>

                                    <Divider
                                        style={{
                                            marginTop: "12px",
                                            marginBottom: "12px"
                                        }}
                                    />
                                    <Space>
                                        <Text strong>
                                            Ranking Score Density
                                        </Text>

                                        <Dropdown
                                            overlay={setting}
                                            placement="bottomLeft"
                                        >
                                            <SettingOutlined />
                                        </Dropdown>
                                    </Space>

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
                                            marginTop: "12px",
                                            marginBottom: "12px"
                                        }}
                                    />
                                    <Row>
                                        <Col span={11}>
                                            <Text strong> Selected Data </Text>
                                        </Col>
                                        <Col span={13}>
                                            <Text>
                                                {selectedNodes.length +
                                                    "/" +
                                                    Object.keys(input.nodes)
                                                        .length +
                                                    " nodes"}
                                            </Text>
                                        </Col>
                                    </Row>
                                    <br />
                                    <Row>
                                        <Col span={11}>
                                            <Text strong>
                                                Mining Result Range:
                                            </Text>
                                        </Col>
                                        <Col span={13}>
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
                                        </Col>
                                    </Row>

                                    <br />
                                </div>
                            </Card>
                            <br />
                            <Card size="small" title="Subgroup Table">
                                <SubgroupTable
                                    canvasHeight={globalHeight * 0.32}
                                />
                            </Card>
                        </Col>
                        <Col span={18}>
                            <Row
                                justify="space-around"
                                gutter={16}
                                style={{ marginBottom: 16 }}
                            >
                                <Col span={17}>
                                    <Card
                                        size="small"
                                        title="Attributes View"
                                        extra={
                                            <Space>
                                                <Text>Highlight Attribute</Text>
                                                <Switch
                                                    checked={
                                                        this.state
                                                            .highlightAttribute
                                                    }
                                                    onChange={checked => {
                                                        this.setState({
                                                            highlightAttribute: checked
                                                        });
                                                    }}
                                                />
                                            </Space>
                                        }
                                    >
                                        <ParallelSetView
                                            canvasHeight={globalHeight * 0.37}
                                        />
                                    </Card>
                                </Col>
                                <Col span={7}>
                                    <Card
                                        size="small"
                                        title="Attributes Setting"
                                    >
                                        <div style={{ padding: 16 }}>
                                            <Row>
                                                <Col span={10}>
                                                    <Text strong>
                                                        Attributes
                                                    </Text>
                                                </Col>
                                                <Col span={14}>
                                                    <MultipleSelect />
                                                </Col>
                                            </Row>

                                            <Divider
                                                style={{
                                                    marginTop: "12px",
                                                    marginBottom: "12px"
                                                }}
                                            />
                                            <Row>
                                                <Col span={10}>
                                                    <Text strong>
                                                        Distribution Similarity
                                                    </Text>
                                                </Col>
                                                <Col span={14}>
                                                    <Select
                                                        onChange={() => {}}
                                                        style={{
                                                            width: "100%"
                                                        }}
                                                        value={"kldivergence"}
                                                    >
                                                        <Option
                                                            key="kldivergence"
                                                            value="kldivergence"
                                                        >
                                                            KL Divergence
                                                        </Option>
                                                    </Select>
                                                </Col>
                                            </Row>
                                            <KLDivergenceView
                                                canvasHeight={
                                                    globalHeight * 0.26
                                                }
                                                canvasWidth={300}
                                            />
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                            <Row justify="space-around" gutter={16}>
                                <Col span={24}>
                                    <Card
                                        size="small"
                                        title="Rank Mapping View"
                                        extra={
                                            <Space>
                                                <Text>
                                                    Show advantaged nodes
                                                </Text>
                                                <Switch
                                                    checked={
                                                        this.state
                                                            .showAdvantagedNode
                                                    }
                                                    onChange={checked => {
                                                        this.setState({
                                                            showAdvantagedNode: checked
                                                        });
                                                    }}
                                                />
                                                <Text>
                                                    Show disadvantaged nodes
                                                </Text>
                                                <Switch
                                                    checked={
                                                        this.state
                                                            .showDisadvantagedNode
                                                    }
                                                    onChange={checked => {
                                                        this.setState({
                                                            showDisadvantagedNode: checked
                                                        });
                                                    }}
                                                />
                                                <Text>Comparison</Text>
                                                <Switch
                                                    checked={
                                                        this.state
                                                            .comparisonMode
                                                    }
                                                    onChange={checked => {
                                                        this.setState({
                                                            comparisonMode: checked
                                                        });
                                                    }}
                                                />
                                            </Space>
                                        }
                                    >
                                        <Row>
                                            <Col span={16}>
                                                <div
                                                    style={{
                                                        height:
                                                            globalHeight * 0.45,
                                                        overflowY: "scroll"
                                                    }}
                                                >
                                                    <RankMappingView
                                                        svgID={"rank-mapping"}
                                                        canvasHeight={
                                                            globalHeight * 0.45
                                                        }
                                                    />
                                                </div>
                                            </Col>
                                            <Col span={8}>
                                                {/*<ProportionView*/}
                                                {/*    svgID={"proportion"}*/}
                                                {/*    canvasHeight={globalHeight * 0.1}*/}
                                                {/*/>*/}
                                                <div
                                                    style={{
                                                        paddingTop: 16,
                                                        paddingLeft: 16
                                                    }}
                                                >
                                                    <ProportionViewNew
                                                        comparisonMode={
                                                            this.state
                                                                .comparisonMode
                                                        }
                                                    />
                                                    <br />
                                                    <GroupShiftingViewNew
                                                        canvasHeight={
                                                            globalHeight * 0.37
                                                        }
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Layout>
            </React.Fragment>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Main);
