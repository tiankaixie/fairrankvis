import * as React from "react";
import { connect } from "react-redux";
import * as d3 from "d3";
import { Table, Tag } from "antd";
import { subGroupColor } from "../constants/colorScheme";

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

class SubgroupTable extends React.Component {
    render() {
        let data = [];
        let columns = [];
        const {
            input,
            attributeList,
            brushSelectedCluster,
            canvasHeight,
            nodeColor
        } = this.props;
        if (brushSelectedCluster.size === 0)
            return (
                <Table
                    id={"summary-view"}
                    style={{ height: canvasHeight * 1.08 }}
                    size={"small"}
                    columns={columns}
                    dataSource={[]}
                />
            );
        let wholeData = [];
        let targetNodes = [];
        let similarGroup = {};
        let wholeGroup = {};
        let maxLen = 1;
        wholeData = Object.keys(input.nodes).map(key => input.nodes[key]);
        targetNodes = wholeData.filter(item => {
            return brushSelectedCluster.has(String(item.id));
        });
        const dimensions = [...attributeList.selectedAttributes];
        wholeData.forEach(value => {
            let itemSetID = "";
            dimensions.forEach((d, i) => {
                itemSetID += value[d];
            });
            if (wholeGroup.hasOwnProperty(itemSetID)) {
                wholeGroup[itemSetID].value += 1;
                maxLen = Math.max(maxLen, wholeGroup[itemSetID].value);
            } else {
                wholeGroup[itemSetID] = {
                    id: itemSetID,
                    value: 1
                };
            }
        });
        targetNodes.forEach(value => {
            let itemSetID = "";
            let itemSetList = [];
            let itemSetAttr = {};
            dimensions.forEach((d, i) => {
                itemSetID += value[d];
                itemSetAttr[d] = input.labels[d]["map"][value[d]];
            });

            if (similarGroup.hasOwnProperty(itemSetID)) {
                similarGroup[itemSetID].groupCount += 1;
            } else {
                similarGroup[itemSetID] = {
                    id: itemSetID,
                    name: itemSetList,
                    groupCount: 1,
                    totalCount: wholeGroup[itemSetID].value
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

        const subgroupColor = nodeColor;
        // d3    .scaleOrdinal()
        //     .domain(itemSetIDLists)
        //     .range(subGroupColor);

        columns.push({
            title: "Color",
            field: "id",
            cellStyle: {
                fontSize: "0.7rem"
            },
            render: rowData => {
                return (
                    <Tag
                        color={subgroupColor(rowData["id"])}
                        key={rowData["id"]}
                    >
                        {rowData["id"]}
                    </Tag>
                );
            }
        });

        // columns.push({
        //     title: "ID",
        //     field: "id",
        //     cellStyle: {
        //         fontSize: "0.8rem"
        //     }
        // });

        dimensions.forEach(d => {
            columns.push({
                title: d,
                field: d,
                cellStyle: {
                    fontSize: "0.6rem"
                },
                render: rowData => {
                    if (rowData[d]) {
                        return <div style={{ width: 100 }}>{rowData[d]}</div>;
                    } else {
                        return "N/A";
                    }
                }
            });
        });

        columns.push({
            title: "cnt./ttl.",
            field: "groupCount",
            cellStyle: {
                fontSize: "0.8rem"
            },
            render: rowData => {
                return (
                    rowData["groupCount"] + "(/" + rowData["totalCount"] + ")"
                );
            }
        });

        columns.push({
            title: "percent.",
            field: "totalCount",
            cellStyle: {
                fontSize: "0.8rem"
            },
            render: rowData => {
                return (
                    " (" +
                    (
                        (rowData["groupCount"] * 100) /
                        rowData["totalCount"]
                    ).toFixed(2) +
                    "%)"
                );
            }
        });

        return (
            <Table
                id={"summary-view"}
                style={{ height: canvasHeight * 1.08 }}
                size={"small"}
                pagination={false}
                columns={columns}
                dataSource={similarGroup}
                scroll={{ y: canvasHeight * 0.9 }}
            />
        );
    }
}

export default connect(mapStateToProps)(SubgroupTable);
