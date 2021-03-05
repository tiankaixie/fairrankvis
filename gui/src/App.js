import React, {useEffect, useState} from "react";
import "./App.css";
import store from "./store";
import { Provider } from "react-redux";
import "antd/dist/antd.css";
import { Button, DatePicker, version } from "antd";
import Main from "./components/Main";
import Base from "./components/Base";


function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
        width,
        height
    };
}

function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(
        getWindowDimensions()
    );

    useEffect(() => {
        function handleResize() {
            setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return windowDimensions;
}

function App() {
    const { height, width } = useWindowDimensions();
    return (
        <div className="App">
            <Provider store={store}>
                <Base globalHeight={height} />
            </Provider>
        </div>
    );
}

export default App;
