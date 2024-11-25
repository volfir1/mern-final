import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Products from "./Products"; // Adjust the path to where your Products component is located

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Products />} />
            </Routes>
        </Router>
    );
}

export default App;
