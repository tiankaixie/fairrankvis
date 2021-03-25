import * as React from "react";
import * as d3 from "d3";
import { connect } from "react-redux";
import { Row, Col, Space, Tooltip } from "antd";
import Text from "antd/es/typography/Text";
import { subGroupColor } from "../constants/colorScheme";
import { displayName } from "../constants/text";

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

class ProportionViewNew extends React.Component {
    constructor(props) {
        super(props);
        this.container = React.createRef();
    }

    render() {
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
        } = this.props;
        //
        // /***
        //  * Terminate rendering condition
        //  */
        //
        //
        // /***
        //  * Canvas setup
        //  */
        // const height = canvasHeight;
        // const width = this.container.current.getBoundingClientRect().width;
        // const svgRoot = d3.select("#" + svgID);
        // svgRoot.style("width", width);
        // const svgBase = svgRoot.select("g");
        // const margin = { top: 30, right: 40, bottom: 20, left: 65 };
        //
        /***
         * Data processing
         */
        let resultTopK = {};
        let inputTopK = {};
        const nodeResKey = Object.keys(output["res"]);
        if (brushSelectedCluster.size === 0) {
            return <div />;
        }
        const selectedNodes = nodeResKey.filter(item => {
            return brushSelectedCluster.has(String(item));
        });
        const dimensions = [...attributeList.selectedAttributes];
        selectedNodes.sort(
            (a, b) => output["res"][a]["rank"] - output["res"][b]["rank"]
        );
        let itemSetIDLists = new Set();
        Object.keys(input.nodes).forEach(node => {
            let itemSetID = "";
            dimensions.forEach((d, i) => {
                itemSetID += input["nodes"][node][d];
            });
            itemSetIDLists.add(itemSetID);
        });
        let total = 0;
        selectedNodes.forEach(node => {
            let itemSetID = "";
            dimensions.forEach(d => {
                itemSetID += input["nodes"][node][d];
            });
            if (!resultTopK.hasOwnProperty(itemSetID)) {
                resultTopK[itemSetID] = { count: 0, maxCount: 0 };
            }
            resultTopK[itemSetID]["count"]++;
            // resultTopK[itemSetID]["maxCount"]++;
            total++;
        });

        let subgroupIDs = Object.keys(resultTopK);
        subgroupIDs.sort((a, b) => resultTopK[b] - resultTopK[a]);
        itemSetIDLists = [...itemSetIDLists].sort();
        const nodeColor = d3
            .scaleOrdinal()
            .domain(itemSetIDLists)
            .range(subGroupColor);

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

        inputNodes.forEach(node => {
            let itemSetID = "";
            dimensions.forEach(d => {
                itemSetID += input["nodes"][node][d];
            });
            if (!inputTopK.hasOwnProperty(itemSetID)) {
                inputTopK[itemSetID] = { count: 0, maxCount: 0 };
            }
            inputTopK[itemSetID]["count"]++;
            // inputTopK[itemSetID]["maxCount"]++;
        });

        const commonKeys = new Set([
            ...Object.keys(inputTopK),
            ...Object.keys(resultTopK)
        ]);

        commonKeys.forEach(key => {
            if (!inputTopK.hasOwnProperty(key)) {
                inputTopK[key] = { count: 0 };
            }
            if (!resultTopK.hasOwnProperty(key)) {
                resultTopK[key] = { count: 0 };
            }
            inputTopK[key]["maxCount"] = Math.max(
                inputTopK[key]["count"],
                resultTopK[key]["count"]
            );
            resultTopK[key]["maxCount"] = Math.max(
                inputTopK[key]["count"],
                resultTopK[key]["count"]
            );
        });
        const data = [];

        data.push(Object.assign({}, { name: individualSim }, inputTopK));
        data.push(Object.assign({}, { name: modelName }, resultTopK));

        console.log(data);

        const inputProportionComponent = [];
        const outputProportionComponent = [];

        const totalWidth = 320;
        commonKeys.forEach(key => {
            inputProportionComponent.push(
                <div
                    style={{
                        width: this.props.comparisonMode
                            ? (inputTopK[key]["maxCount"] / total) * totalWidth
                            : null,
                        transition: "width 1s"
                    }}
                >
                    <Tooltip
                        placement="top"
                        title={
                            "ID: " + key + " " + ((inputTopK[key]["count"] * 100) / total).toFixed(
                                2
                            ) + "%"
                        }
                    >
                        <div
                            style={{
                                width:
                                    (inputTopK[key]["count"] / total) *
                                    totalWidth,
                                backgroundColor: nodeColor(key),
                                height: 20,
                            }}
                        />
                    </Tooltip>
                </div>
            );
            outputProportionComponent.push(
                <div
                    style={{
                        width: this.props.comparisonMode
                            ? (resultTopK[key]["maxCount"] / total) * totalWidth
                            : null
                    }}
                >
                    <Tooltip
                        placement="bottom"
                        title={
                            "ID: " + key + " " + ((resultTopK[key]["count"] * 100) / total).toFixed(
                                2
                            ) + "%"
                        }
                    >
                        <div
                            style={{
                                width:
                                    (resultTopK[key]["count"] / total) *
                                    totalWidth,
                                backgroundColor: nodeColor(key),
                                height: 20,
                            }}
                        />
                    </Tooltip>
                </div>
            );
        });

        return (
            <React.Fragment>
                <Row>
                    <Col span={5}>
                        <Text>{displayName[individualSim]} </Text>
                    </Col>
                    <Col span={19}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: this.props.comparisonMode
                                    ? "space-around"
                                    : "flex-start",
                                width: "100%"
                            }}
                        >
                            {inputProportionComponent}
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col span={5}>
                        <Text>{displayName[modelName]} </Text>
                    </Col>
                    <Col span={19}>
                        <div
                            style={{
                                marginTop: 5,
                                display: "flex",
                                justifyContent: this.props.comparisonMode
                                    ? "space-around"
                                    : "flex-start",
                                width: "100%"
                            }}
                        >
                            {outputProportionComponent}
                        </div>
                    </Col>
                </Row>
            </React.Fragment>
        );
    }
}

export default connect(mapStateToProps)(ProportionViewNew);
