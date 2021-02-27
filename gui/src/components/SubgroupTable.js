import * as React from "react";
import { connect } from "react-redux";
import * as d3 from "d3";
import {Table, Tag} from "antd";

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
        const { input, attributeList, brushSelectedCluster, canvasHeight } = this.props;
        if (brushSelectedCluster.size === 0) return <div />;
        let wholeData = [];
        let groupData = [];
        let similarGroup = {};
        let wholeGroup = {};
        let maxLen = 1;
        wholeData = Object.keys(input.nodes).map(key => input.nodes[key]);
        groupData = wholeData.filter(item => {
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
        groupData.forEach(value => {
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

        console.log(similarGroup);
        const subgroupColor = d3
            .scaleOrdinal()
            .domain(similarGroup.map(item => item["id"]))
            .range(d3.schemeTableau10);

        columns.push({
            title: "color",
            field: "id",
            cellStyle: {
                fontSize: "0.8rem"
            },
            render: rowData => {
                return (
                    <Tag
                        style={{
                            opacity: 0.5
                        }}
                        color={subgroupColor(rowData["id"])}
                        key={rowData["id"]}
                    >
                        ' '
                    </Tag>
                );
            }
        });

        dimensions.forEach(d => {
            columns.push({
                title: d,
                field: d,
                cellStyle: {
                    fontSize: "0.8rem"
                },
                render: rowData => {
                    if (rowData[d]) {
                        return rowData[d];
                    } else {
                        return "N/A";
                    }
                }
            });
        });

        columns.push({
            title: "Count/Total",
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
            title: "Percentage",
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
                style={{height: canvasHeight}}
                columns={columns}
                dataSource={similarGroup}
            />
        );
    }
}

export default connect(mapStateToProps, null)(SubgroupTable);
