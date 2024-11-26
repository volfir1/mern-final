// hooks/productManager.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchProducts,
  fetchCategories,
  deleteProduct,
  createProduct,
  updateProduct
} from "../api/productApi";

// Utility Functions
export const getCategoryName = (categories, categoryId) => {
  const category = categories.find((cat) => cat._id === categoryId);
  return category ? category.name : "Unknown";
};

export const filterProducts = (products, categories, searchTerm) => {
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCategoryName(categories, product.category)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );
};

export const getPublicIdFromImageUrl = (imageUrl) => {
  const imageUrlParts = imageUrl.split("/");
  const publicIdWithExtension = imageUrlParts.slice(-1)[0];
  return publicIdWithExtension.split(".")[0];
};

// Custom Hook for Product Management
export const useProductManager = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    setFilteredProducts(filterProducts(products, categories, searchTerm));
  }, [products, categories, searchTerm]);

  // Data Loading Functions
  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      if (Array.isArray(data.products)) {
        setProducts(data.products);
        setFilteredProducts(data.products);
      } else {
        setError("Invalid data format.");
      }
    } catch (error) {
      setError("Error fetching products.");
    }
  };

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      if (Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        setError("Invalid data format.");
      }
    } catch (error) {
      setError("Error fetching categories.");
    }
  };

  // Product Management Functions
  const handleDeleteProduct = async () => {
    try {
      const product = products.find((p) => p._id === productToDelete);
      if (!product) {
        throw new Error("Product not found");
      }

      const publicId = getPublicIdFromImageUrl(product.imageUrl);
      await deleteProduct(productToDelete, publicId);
      await loadProducts();
      showSnackbar("Product deleted successfully", "success");
      setOpenDialog(false);
    } catch (error) {
      showSnackbar(error.message || "Error deleting product", "error");
    }
  };

  const confirmDeleteProduct = (productId) => {
    setProductToDelete(productId);
    setOpenDialog(true);
  };

  const handleCreateProduct = async (productData) => {
    try {
      await createProduct(productData);
      await loadProducts();
      showSnackbar("Product created successfully", "success");
    } catch (error) {
      showSnackbar(error.message || "Error creating product", "error");
    }
  };

  const handleUpdateProduct = async (productId, productData) => {
    try {
      await updateProduct(productId, productData);
      await loadProducts();
      showSnackbar("Product updated successfully", "success");
    } catch (error) {
      showSnackbar(error.message || "Error updating product", "error");
    }
  };

  // Pagination Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // UI State Management
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Navigation Functions
  const navigateToCreateProduct = () => {
    navigate("/admin/create-product");
  };

  const navigateToUpdateProduct = (productId) => {
    navigate(`/admin/products/update/${productId}`);
  };

  return {
    // State
    products,
    categories,
    filteredProducts,
    error,
    searchTerm,
    snackbar,
    openDialog,
    productToDelete,
    page,
    rowsPerPage,

    // Data Loading
    loadProducts,
    loadCategories,

    // Product Management
    handleDeleteProduct,
    confirmDeleteProduct,
    handleCreateProduct,
    handleUpdateProduct,

    // Pagination
    handleChangePage,
    handleChangeRowsPerPage,

    // UI State Management
    showSnackbar,
    handleCloseSnackbar,
    setSearchTerm,
    setOpenDialog,

    // Navigation
    navigateToCreateProduct,
    navigateToUpdateProduct,
  };
};

export default useProductManager;