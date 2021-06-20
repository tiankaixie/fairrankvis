import React from "react";
import * as d3 from "d3";
import { connect } from "react-redux";
import { displayName } from "../constants/text";
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
    Input,
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
    Tag,
    Empty
} from "antd";
import { Typography } from "antd";
import {
    CheckCircleOutlined,
    PlusOutlined,
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
import Modal from "antd/es/modal/Modal";
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
            highlightAttribute: true,
            displayAttributeModal: false
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
            individualSim,
            updateBrushClusterSelected
        } = this.props;
        // console.log(Object.keys(input.edges).length);
        // console.log(Object.keys(input.labels).length);
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
                        <Text>Ranking range:</Text>
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
                                extra={
                                    <div style={{ display: "flex" }}>
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
                                            <Option key="weibo" value="weibo">
                                                Weibo
                                            </Option>
                                        </Select>
                                        <Select
                                            size={"small"}
                                            onChange={() => {}}
                                            style={{
                                                width: "100%"
                                            }}
                                            value={individualSim}
                                        >
                                            <Option
                                                key="pagerank"
                                                value="pagerank"
                                            >
                                                {displayName[individualSim]}
                                            </Option>
                                        </Select>
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
                                                {displayName["attrirank"]}
                                            </Option>
                                            <Option key="inform" value="inform">
                                                {displayName["inform"]}
                                            </Option>
                                        </Select>
                                        <QuestionCircleOutlined />
                                    </div>
                                }
                            >
                                <div
                                    style={{
                                        paddingLeft: 16,
                                        paddingRight: 16
                                    }}
                                >
                                    {/* <Row>
                                        <Col span={14}>
                                            <Text>Dataset</Text>
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
                                            <Text>{"Base Ranking Model"}</Text>
                                        </Col>
                                        <Col span={10}>
                                            <Select
                                                size={"small"}
                                                onChange={() => {}}
                                                style={{
                                                    width: "100%"
                                                }}
                                                value={individualSim}
                                            >
                                                <Option
                                                    key="pagerank"
                                                    value="pagerank"
                                                >
                                                    {displayName[individualSim]}
                                                </Option>
                                            </Select>
                                        </Col>
                                    </Row>
                                    <br />
                                    <Row> 
                                        <Col span={14}>
                                            <Text>
                                                {"Target Ranking Model"}
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
                                                    {displayName["attrirank"]}
                                                </Option>
                                                <Option
                                                    key="inform"
                                                    value="inform"
                                                >
                                                    {displayName["inform"]}
                                                </Option>
                                            </Select>
                                        </Col>
                                    </Row>*/}
                                    {/* <Divider
                                        style={{
                                            marginTop: "12px",
                                            marginBottom: "12px"
                                        }}
                                    /> */}
                                    <Space>
                                        <Text>Ranking Score Density</Text>

                                        <Dropdown
                                            overlay={setting}
                                            placement="bottomLeft"
                                            trigger={["click"]}
                                        >
                                            <SettingOutlined />
                                        </Dropdown>
                                    </Space>

                                    <MiningResultDensity
                                        canvasHeight={globalHeight * 0.18}
                                        miningResultControl={
                                            this.state.miningResultControl
                                        }
                                    />
                                    {miningResultDensity}
                                    <Divider
                                        style={{
                                            marginTop: "12px",
                                            marginBottom: "12px"
                                        }}
                                    />
                                    <Row>
                                        <Col span={14}>
                                            <Text> Selected Data </Text>
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
                                            <Text>Ranking Score Range:</Text>
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
                                title="GROUPS"
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
                                    canvasHeight={globalHeight * 0.42}
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
                                            {brushSelectedCluster.size > 0 ? (
                                                <ParallelSetView
                                                    canvasHeight={
                                                        globalHeight * 0.36
                                                    }
                                                />
                                            ) : (
                                                <Empty
                                                    image={
                                                        Empty.PRESENTED_IMAGE_SIMPLE
                                                    }
                                                    imageStyle={{
                                                        marginTop:
                                                            (globalHeight *
                                                                0.36) /
                                                            2.9
                                                    }}
                                                />
                                            )}
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
                                                <Col span={10}>
                                                    <Text>
                                                        Selected Attributes
                                                    </Text>
                                                </Col>
                                                <Col span={14}>
                                                    <MultipleSelect />
                                                </Col>
                                            </Row>
                                            <br />
                                            {brushSelectedCluster.size > 0 ? (
                                                <List
                                                    itemLayout="horizontal"
                                                    dataSource={[
                                                        ...attributeList.selectedAttributes
                                                    ].map(item => {
                                                        return { title: item };
                                                    })}
                                                    style={{
                                                        height:
                                                            globalHeight * 0.09,
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
                                                                    width:
                                                                        "100%"
                                                                }}
                                                            >
                                                                <Row justify="space-between">
                                                                    <Col
                                                                        span={6}
                                                                    >
                                                                        <Text>
                                                                            {
                                                                                item.title
                                                                            }
                                                                        </Text>
                                                                    </Col>
                                                                    <Col
                                                                        span={
                                                                            12
                                                                        }
                                                                    >
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
                                                                    <Col
                                                                        span={6}
                                                                    >
                                                                        <Button
                                                                            size={
                                                                                "small"
                                                                            }
                                                                            onClick={() => {
                                                                                this.setState(
                                                                                    {
                                                                                        displayAttributeModal: true
                                                                                    }
                                                                                );
                                                                            }}
                                                                        >
                                                                            Settings
                                                                        </Button>
                                                                        <Modal
                                                                            title="Attribute: fans Range: 0 - 19494813"
                                                                            visible={
                                                                                this
                                                                                    .state
                                                                                    .displayAttributeModal
                                                                            }
                                                                            onOk={() => {
                                                                                this.setState(
                                                                                    {
                                                                                        displayAttributeModal: false
                                                                                    }
                                                                                );
                                                                            }}
                                                                            onCancel={() => {
                                                                                this.setState(
                                                                                    {
                                                                                        displayAttributeModal: false
                                                                                    }
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Space direction="vertical">
                                                                                <Space>
                                                                                    <Text>
                                                                                        #1
                                                                                    </Text>
                                                                                    <Input
                                                                                        placeholder="value"
                                                                                        value={
                                                                                            "above 10M"
                                                                                        }
                                                                                    />
                                                                                    <Input
                                                                                        placeholder="from"
                                                                                        value={
                                                                                            "10000000"
                                                                                        }
                                                                                    />
                                                                                    <Input
                                                                                        className="site-input-split"
                                                                                        style={{
                                                                                            width: 30,
                                                                                            borderLeft: 0,
                                                                                            borderRight: 0,
                                                                                            pointerEvents:
                                                                                                "none"
                                                                                        }}
                                                                                        placeholder="~"
                                                                                        disabled
                                                                                    />
                                                                                    <Input
                                                                                        placeholder="to"
                                                                                        value={
                                                                                            "19494813"
                                                                                        }
                                                                                    />
                                                                                    <Button
                                                                                        type="primary"
                                                                                        danger
                                                                                    >
                                                                                        Delete
                                                                                    </Button>
                                                                                </Space>
                                                                                <Space>
                                                                                    <Text>
                                                                                        #2
                                                                                    </Text>
                                                                                    <Input
                                                                                        placeholder="value"
                                                                                        value={
                                                                                            "1M to 10M"
                                                                                        }
                                                                                    />
                                                                                    <Input
                                                                                        placeholder="from"
                                                                                        value={
                                                                                            "1000000"
                                                                                        }
                                                                                    />
                                                                                    <Input
                                                                                        className="site-input-split"
                                                                                        style={{
                                                                                            width: 30,
                                                                                            borderLeft: 0,
                                                                                            borderRight: 0,
                                                                                            pointerEvents:
                                                                                                "none"
                                                                                        }}
                                                                                        placeholder="~"
                                                                                        disabled
                                                                                    />
                                                                                    <Input
                                                                                        placeholder="to"
                                                                                        value={
                                                                                            "10000000"
                                                                                        }
                                                                                    />
                                                                                    <Button
                                                                                        type="primary"
                                                                                        danger
                                                                                    >
                                                                                        Delete
                                                                                    </Button>
                                                                                </Space>

                                                                                <Space>
                                                                                    <Text>
                                                                                        #3
                                                                                    </Text>
                                                                                    <Input
                                                                                        placeholder="value"
                                                                                        value={
                                                                                            "10k to 1M"
                                                                                        }
                                                                                    />
                                                                                    <Input
                                                                                        placeholder="from"
                                                                                        value={
                                                                                            "10000"
                                                                                        }
                                                                                    />
                                                                                    <Input
                                                                                        className="site-input-split"
                                                                                        style={{
                                                                                            width: 30,
                                                                                            borderLeft: 0,
                                                                                            borderRight: 0,
                                                                                            pointerEvents:
                                                                                                "none"
                                                                                        }}
                                                                                        placeholder="~"
                                                                                        disabled
                                                                                    />
                                                                                    <Input
                                                                                        placeholder="to"
                                                                                        value={
                                                                                            "1000000"
                                                                                        }
                                                                                    />
                                                                                    <Button
                                                                                        type="primary"
                                                                                        danger
                                                                                    >
                                                                                        Delete
                                                                                    </Button>
                                                                                </Space>
                                                                                <Space>
                                                                                    <Text>
                                                                                        #4
                                                                                    </Text>
                                                                                    <Input
                                                                                        placeholder="value"
                                                                                        value={
                                                                                            "under 10k"
                                                                                        }
                                                                                    />
                                                                                    <Input
                                                                                        placeholder="from"
                                                                                        value={
                                                                                            "0"
                                                                                        }
                                                                                    />
                                                                                    <Input
                                                                                        className="site-input-split"
                                                                                        style={{
                                                                                            width: 30,
                                                                                            borderLeft: 0,
                                                                                            borderRight: 0,
                                                                                            pointerEvents:
                                                                                                "none"
                                                                                        }}
                                                                                        placeholder="~"
                                                                                        disabled
                                                                                    />
                                                                                    <Input
                                                                                        placeholder="to"
                                                                                        value={
                                                                                            "10000"
                                                                                        }
                                                                                    />
                                                                                    <Button
                                                                                        type="primary"
                                                                                        danger
                                                                                    >
                                                                                        Delete
                                                                                    </Button>
                                                                                </Space>
                                                                                <Button
                                                                                    style={{
                                                                                        width:
                                                                                            "100%"
                                                                                    }}
                                                                                    size={
                                                                                        "small"
                                                                                    }
                                                                                >
                                                                                    <PlusOutlined />
                                                                                </Button>
                                                                            </Space>
                                                                        </Modal>
                                                                    </Col>
                                                                </Row>
                                                            </div>
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : (
                                                <Empty
                                                    style={{ marginTop: 10 }}
                                                    image={
                                                        Empty.PRESENTED_IMAGE_SIMPLE
                                                    }
                                                />
                                            )}

                                            <Divider
                                                style={{
                                                    marginTop: "12px",
                                                    marginBottom: "12px"
                                                }}
                                            />
                                            <Row>
                                                <Col span={12}>
                                                    <Text>
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
                                                <Text>
                                                    Advantaged individuals
                                                </Text>
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
                                                <Text>
                                                    Disadvantaged individuals
                                                </Text>
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
                                        {brushSelectedCluster.size > 0 ? (
                                            <Row>
                                                <Col span={16}>
                                                    <div
                                                        style={{
                                                            height:
                                                                globalHeight *
                                                                0.46,
                                                            overflowY: "scroll",
                                                            overflowX: "hidden"
                                                        }}
                                                    >
                                                        <RankMappingView
                                                            svgID={
                                                                "rank-mapping"
                                                            }
                                                            canvasHeight={
                                                                globalHeight *
                                                                0.44
                                                            }
                                                            showAdvantagedNode={
                                                                this.state
                                                                    .showAdvantagedNode
                                                            }
                                                            showDisadvantagedNode={
                                                                this.state
                                                                    .showDisadvantagedNode
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
                                                                globalHeight *
                                                                0.37
                                                            }
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                        ) : (
                                            <Empty
                                                image={
                                                    Empty.PRESENTED_IMAGE_SIMPLE
                                                }
                                                imageStyle={{
                                                    marginTop:
                                                        globalHeight * 0.2
                                                }}
                                                style={{
                                                    height: globalHeight * 0.23
                                                }}
                                            />
                                        )}
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
