import axios from "axios";
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

// export function getData(name) {
//   return function(dispatch, getState) {
//     axios
//       .post(
//         "/getData/",
//         {
//           name: name,
//           meta: "tbd"
//         },
//         { timeout: 160000 }
//       )
//       .then(response => {
//         const parsedData = JSON.parse(JSON.stringify(response.data));
//         // alert(parsedData);
//         let data = {};
//         data[name] = parsedData;
//         console.log(parsedData);
//         dispatch({ type: LOADING_DATA, payload: {data: data} });
//       });
//   };
// }

export function getData() {
    return function(dispatch, getState) {
        axios
            .post(
                "/getData/",
                {
                    data_name: getState().dataName,
                    model_name: getState().modelName,
                    individual_sim: getState().individualSim
                },
                { timeout: 160000 }
            )
            .then(response => {
                const parsedData = JSON.parse(JSON.stringify(response.data));
                // console.log("Data loaded");
                // console.log(parsedData);
                dispatch({ type: LOADING_DATA, payload: parsedData });
            });
    };
}

export function updateDataName(payload) {
    return { type: UPDATE_DATA_NAME, payload };
}

export function updateModelName(payload) {
    return { type: UPDATE_MODEL_NAME, payload };
}

export function updateTableData(payload) {
    return { type: UPDATE_TABLE_DATA, payload };
}

export function updateIndividualSim(payload) {
    return { type: UPDATE_INDIVIDUAL_SIM, payload };
}

export function updateIndividualResSim(payload) {
    return { type: UPDATE_INDIVIDUAL_RES_SIM, payload };
}

export function updateClusterSliderValue(payload) {
    return { type: UPDATE_CLUSTER_SLIDER_VALUE, payload };
}

export function updateSelectedCluster(payload) {
    return { type: UPDATE_SELECTED_CLUSTER, payload };
}

export function updateHighlightedAttribute(payload) {
    return { type: UPDATE_HIGHLIGHTED_ATTRIBUTE, payload };
}

export function updateSelectedAttributes(payload) {
    return { type: UPDATE_SELECTED_ATTRIBUTES, payload };
}

export function updateLassoSelected(payload) {
    return { type: UPDATE_LASSO_SELECTED, payload };
}

export function updateBrushClusterSelected(payload) {
    return { type: UPDATE_BRUSH_CLUSTER_SELECTED, payload };
}

export function updatePairwiseCommonAttributes(payload) {
    return { type: UPDATE_PAIRWISE_COMMON_ATTRIBUTES, payload };
}

// export function getData() {
//   return function (dispatch, getState) {
//     axios
//       .post(
//         "/test/",
//         {
//           who: "bobur",
//         },
//         { timeout: 160000 }
//       )
//       .then((response) => {
//         const parsedData = JSON.parse(JSON.stringify(response.data));
//         // alert(parsedData);
//         dispatch({type: LOADING_DATA, payload: parsedData});
//       });
//   };
// }
