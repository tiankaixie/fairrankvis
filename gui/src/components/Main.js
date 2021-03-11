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
    Space,
    List,
    Alert,
    Tag
} from "antd";
import { Typography } from "antd";
import {
    CheckCircleOutlined,
    QuestionCircleOutlined,
    SettingOutlined
} from "@ant-design/icons";
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
import Avatar from "antd/es/avatar/avatar";
import Search from "antd/es/input/Search";
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
            attributeList,
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
                    <p>
                        <Text strong>Ranking range:</Text>
                    </p>
                    <Space>
                        <InputNumber
                            min={0}
                            size={"small"}
                            max={Object.keys(output.res).length}
                            style={{ width: "50px" }}
                            value={leftRank}
                            onChange={newValue => {
                                updateSelectedClusterHelper(
                                    newValue,
                                    rightRank
                                );
                            }}
                        />

                        <Slider
                            min={0}
                            style={{ width: "270px" }}
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

                        <InputNumber
                            min={0}
                            size={"small"}
                            max={Object.keys(output.res).length}
                            style={{ width: "50px" }}
                            value={rightRank}
                            onChange={newValue => {
                                updateSelectedClusterHelper(leftRank, newValue);
                            }}
                        />
                    </Space>
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
                            <Card
                                size="small"
                                title="DATA"
                                extra={<QuestionCircleOutlined />}
                            >
                                <div
                                    style={{
                                        paddingLeft: 16,
                                        paddingRight: 16
                                    }}
                                >
                                    <Row>
                                        <Col span={14}>
                                            <Text strong>Dataset</Text>
                                        </Col>
                                        <Col span={10}>
                                            <Select
                                                size={"small"}
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
                                        <Col span={14}>
                                            <Text strong>
                                                {"Ranking Model"}
                                            </Text>
                                        </Col>
                                        <Col span={10}>
                                            <Select
                                                size={"small"}
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
                                        <Col span={14}>
                                            <Text strong> Selected Data </Text>
                                        </Col>
                                        <Col span={10}>
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
                                        <Col span={14}>
                                            <Text strong>
                                                Mining Result Range:
                                            </Text>
                                        </Col>
                                        <Col span={10}>
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
                            <Card
                                size="small"
                                title="SUBGROUPS"
                                extra={
                                    <Space>
                                        <Search
                                            placeholder="search"
                                            allowClear
                                            size="small"
                                            onSearch={() => {}}
                                        />
                                        <QuestionCircleOutlined />
                                    </Space>
                                }
                            >
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
                                        title="ATTRIBUTES VIEW"
                                        extra={
                                            <Space>
                                                <Text>Highlight Attribute</Text>
                                                <Switch
                                                    size="small"
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
                                                <QuestionCircleOutlined />
                                            </Space>
                                        }
                                    >
                                        <div
                                            style={{
                                                height: globalHeight * 0.375,
                                                overflowY: "scroll",
                                                overflowX: "hidden"
                                            }}
                                        >
                                            <ParallelSetView
                                                canvasHeight={
                                                    globalHeight * 0.36
                                                }
                                            />
                                        </div>
                                    </Card>
                                </Col>
                                <Col span={7}>
                                    <Card
                                        size="small"
                                        title="ATTRIBUTES SETTING"
                                        extra={<QuestionCircleOutlined />}
                                    >
                                        <div style={{ padding: 16 }}>
                                            <Row>
                                                <Col span={12}>
                                                    <Text strong>
                                                        Selected Attributes
                                                    </Text>
                                                </Col>
                                                <Col span={12}>
                                                    <MultipleSelect />
                                                </Col>
                                            </Row>
                                            <br />
                                            <List
                                                itemLayout="horizontal"
                                                dataSource={[
                                                    ...attributeList.selectedAttributes
                                                ].map(item => {
                                                    return { title: item };
                                                })}
                                                style={{
                                                    height: globalHeight * 0.09,
                                                    overflowY: "scroll",
                                                    overflowX: "hidden"
                                                }}
                                                size="small"
                                                renderItem={item => (
                                                    <List.Item
                                                        style={{
                                                            paddingLeft: 0,
                                                            paddingRight: 0
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: "100%"
                                                            }}
                                                        >
                                                            <Row justify="space-between">
                                                                <Col span={8}>
                                                                    <Text
                                                                        strong
                                                                    >
                                                                        {
                                                                            item.title
                                                                        }
                                                                    </Text>
                                                                </Col>
                                                                <Col>
                                                                    <Tag
                                                                        icon={
                                                                            <CheckCircleOutlined />
                                                                        }
                                                                        color="success"
                                                                    >
                                                                        Categorical
                                                                        Attribute
                                                                    </Tag>
                                                                </Col>
                                                                <Col>
                                                                    <Button
                                                                        disabled
                                                                        size={
                                                                            "small"
                                                                        }
                                                                    >
                                                                        Settings
                                                                    </Button>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    </List.Item>
                                                )}
                                            />
                                            <Divider
                                                style={{
                                                    marginTop: "12px",
                                                    marginBottom: "12px"
                                                }}
                                            />
                                            <Row>
                                                <Col span={12}>
                                                    <Text strong>
                                                        Distribution Similarity
                                                    </Text>
                                                </Col>
                                                <Col span={12}>
                                                    <Select
                                                        onChange={() => {}}
                                                        size={"small"}
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
                                                    globalHeight * 0.16
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
                                        title="RANK MAPPING"
                                        extra={
                                            <Space>
                                                <Text>Advantaged nodes</Text>
                                                <Switch
                                                    size="small"
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
                                                <Text>Disadvantaged nodes</Text>
                                                <Switch
                                                    size="small"
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
                                                    size="small"
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
                                                <QuestionCircleOutlined />
                                            </Space>
                                        }
                                    >
                                        <Row>
                                            <Col span={16}>
                                                <div
                                                    style={{
                                                        height:
                                                            globalHeight * 0.45,
                                                        overflowY: "scroll",
                                                        overflowX: "hidden"
                                                    }}
                                                >
                                                    <RankMappingView
                                                        svgID={"rank-mapping"}
                                                        canvasHeight={
                                                            globalHeight * 0.44
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
