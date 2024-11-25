// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import ProductsDemo from "./admin/product/Products";
import Suppliers from "./admin/supplier/Suppliers";
import CreateProduct from "./admin/product/CreateProduct";
import UpdateProduct from "./admin/product/UpdateProduct";
import Settings from "./components/others/Settings";
import Category from "./admin/category/Category";
import { ThemeProvider as CustomThemeProvider } from "./components/others/Theme";

const theme = createTheme();

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CustomThemeProvider>
        <div className="app-wrapper">
          <div className="flex">
            {/* Sidebar - You can add your Sidebar here */}

            <div className="content flex-grow">
              <Routes>
                <Route path="/admin/products" element={<ProductsDemo />} />
                <Route path="/admin/suppliers" element={<Suppliers />} />
                <Route
                  path="/admin/create-product"
                  element={<CreateProduct />}
                />
                <Route
                  path="/admin/products/update/:id"
                  element={<UpdateProduct />}
                />
                <Route path="/admin/settings" element={<Settings />} />
                {/* Category management routes */}
                <Route path="/admin/categories" element={<Category />} />
              </Routes>
            </div>
          </div>
        </div>
      </CustomThemeProvider>
    </ThemeProvider>
  );
};

export default App;
