import {
    LOADING_DATA,
    UPDATE_BRUSH_CLUSTER_SELECTED,
    UPDATE_CLUSTER_SLIDER_VALUE,
    UPDATE_DATA_NAME,
    UPDATE_HIGHLIGHTED_ATTRIBUTE,
    UPDATE_INDIVIDUAL_RES_SIM,
    UPDATE_INDIVIDUAL_SIM,
    UPDATE_LASSO_SELECTED,
    UPDATE_MODEL_NAME,
    UPDATE_PAIRWISE_COMMON_ATTRIBUTES,
    UPDATE_SELECTED_ATTRIBUTES,
    UPDATE_SELECTED_CLUSTER,
    UPDATE_TABLE_DATA
} from "../constants/actionTypes";

const initialStateConfig = {
    facebook: {
        initialAttributes: new Set([
            //"birthday",
            // "gender",
            // "locale"
            //"middle_name",
            //"political"
        ])
    },
    synthesis: {
        initialAttributes: new Set([
            //"birthday",
            //"gender",
            //"race"
            //"middle_name",
            //"political"
        ])
    },
    weibo: {
        initialAttributes: new Set([
            //"birthday",
            // "gender",
            // "fans"
            //"middle_name",
            //"political"
        ])
    }
};

const initialState = {
    dataName: "weibo",
    modelName: "inform",
    // dataName: "facebook",
    // modelName: "attrirank",
    individualSim: "pagerank",
    pairwiseAttribute: "pagerank",
    input: {
        labels: {},
        edges: {},
        nodes: {},
        common_matrix: {}
    },
    output: {
        res: {},
        similarity: {}
    },
    tableData: [],
    lassoSelected: new Set(),
    // when the barchar overview brush instances, the filtered will be stored here.
    brushSelectedCluster: new Set(),
    ui: {
        clusterSliderUI: {
            minValue: 0,
            maxValue: 100,
            step: 10,
            value: 30
        },
        clusterList: {
            selectedCluster: 1
        },
        attributeList: {
            highlightedAttribute: "",
            selectedAttributes: new Set()
        }
    }
};

function rootReducer(state = initialState, action) {
    if (action.type === LOADING_DATA) {
        console.info("LOADING_DATA");
        console.info(action.payload);
        let attributeListValues = {
            highlightedAttribute: "",
            selectedAttributes: new Set(
                Object.keys(action.payload.input.labels)
            )
        };
        if ("initialAttributes" in initialStateConfig[initialState.dataName]) {
            attributeListValues["selectedAttributes"] =
                initialStateConfig[initialState.dataName]["initialAttributes"];
        }
        let newState = Object.assign({}, state, {
            ui: {
                clusterSliderUI: {
                    value: 15,
                    minValue: 0,
                    maxValue: 25,
                    step: 1
                },
                clusterList: state.ui.clusterList,
                attributeList: attributeListValues
            }
        });
        return Object.assign({}, state, newState, action.payload);
    }

    if (action.type === UPDATE_DATA_NAME) {
        return Object.assign({}, state, { dataName: action.payload });
    }

    if (action.type === UPDATE_MODEL_NAME) {
        console.log("UPDATE_MODEL_NAME");
        return Object.assign({}, state, { modelName: action.payload });
    }

    if (action.type === UPDATE_TABLE_DATA) {
        console.log("UPDATE_TABLE_DATA");
        console.log(action.payload);
        return Object.assign({}, state, { tableData: action.payload });
    }

    if (action.type === UPDATE_LASSO_SELECTED) {
        console.log("UPDATE_LASSO_SELECTED");
        return Object.assign({}, state, { lassoSelected: action.payload });
    }

    if (action.type === UPDATE_BRUSH_CLUSTER_SELECTED) {
        console.log("UPDATE_BRUSH_CLUSTER_SELECTED");
        return Object.assign({}, state, {
            brushSelectedCluster: action.payload
        });
    }

    if (action.type === UPDATE_INDIVIDUAL_SIM) {
        console.log("UPDATE_INDIVIDUAL_SIM");
        return Object.assign({}, state, { individualSim: action.payload });
    }

    if (action.type === UPDATE_PAIRWISE_COMMON_ATTRIBUTES) {
        console.log("UPDATE_PAIRWISE_COMMON_ATTRIBUTES");
        return Object.assign({}, state, { pairwiseAttribute: action.payload });
    }

    if (action.type === UPDATE_INDIVIDUAL_RES_SIM) {
        console.log("UPDATE_INDIVIDUAL_RES_SIM");
        return Object.assign({}, state, { individualResSim: action.payload });
    }

    if (action.type === UPDATE_CLUSTER_SLIDER_VALUE) {
        console.log("UPDATE_CLUSTER_SLIDER_VALUE");
        return Object.assign({}, state, {
            ui: {
                clusterSliderUI: {
                    value: action.payload,
                    minValue: state.ui.clusterSliderUI.minValue,
                    maxValue: state.ui.clusterSliderUI.maxValue,
                    step: state.ui.clusterSliderUI.step
                },
                clusterList: state.ui.clusterList,
                attributeList: state.ui.attributeList
            }
        });
    }

    if (action.type === UPDATE_SELECTED_CLUSTER) {
        console.log("UPDATE_SELECTED_CLUSTER");
        return Object.assign({}, state, {
            ui: {
                clusterSliderUI: state.ui.clusterSliderUI,
                clusterList: {
                    selectedCluster: action.payload
                },
                attributeList: state.ui.attributeList
            }
        });
    }

    if (action.type === UPDATE_SELECTED_ATTRIBUTES) {
        console.log("UPDATE_SELECTED_ATTRIBUTES");
        const temp = Object.assign({}, state, {
            ui: {
                clusterSliderUI: state.ui.clusterSliderUI,
                clusterList: state.ui.clusterList,
                attributeList: {
                    highlightedAttribute:
                        state.ui.attributeList.highlightedAttribute,
                    selectedAttributes: action.payload
                }
            }
        });
        console.log(temp);
        return temp;
    }

    if (action.type === UPDATE_HIGHLIGHTED_ATTRIBUTE) {
        console.log("UPDATE_HIGHLIGHTED_ATTRIBUTE");
        const temp = Object.assign({}, state, {
            ui: {
                clusterSliderUI: state.ui.clusterSliderUI,
                clusterList: state.ui.clusterList,
                attributeList: {
                    highlightedAttribute: action.payload,
                    selectedAttributes:
                        state.ui.attributeList.selectedAttributes
                }
            }
        });
        console.log(temp);
        return temp;
    }

    return state;
}

export default rootReducer;
