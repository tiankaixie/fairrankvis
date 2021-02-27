import React from "react";
import { connect } from "react-redux";
import { updateSelectedAttributes } from "../actions";
import { Select } from "antd";
const { Option } = Select;

const mapStateToProps = state => {
    return {
        input: state.input,
        output: state.output,
        clusterList: state.ui.clusterList,
        attributeList: state.ui.attributeList,
        clusterSliderUI: state.ui.clusterSliderUI
    };
};

const mapDispatchToProps = dispatch => {
    return {
        updateSelectedAttributes: attribute =>
            dispatch(updateSelectedAttributes(attribute))
    };
};

function MultipleSelect(props) {
    const { input, attributeList, updateSelectedAttributes } = props;

    const handleChange = value => {
        console.log(value);
        updateSelectedAttributes(value);
    };

    let attributes = [];
    const data = Object.keys(input.nodes).map(key => input.nodes[key]);
    if (data.length > 0) {
        attributes = Object.keys(data[0]).filter(d => {
            return (
                d !== "id" &&
                d !== "x" &&
                d !== "y" &&
                d !== "sim_x" &&
                d !== "sim_y"
            );
        });
    }
    console.log([...attributeList.selectedAttributes])
    return (
        <Select
            mode="multiple"
            allowClear
            style={{ width: "100%" }}
            onChange={handleChange}
            value={[...attributeList.selectedAttributes]}
        >
            {attributes.map(name => (
                <Option key={name} value={name}>{name}</Option>
            ))}
        </Select>
    );
}

export default connect(mapStateToProps, mapDispatchToProps)(MultipleSelect);
