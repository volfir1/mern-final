import React, { useState } from 'react';
import './HomePage.css';  // Importing the CSS file in the same directory
import { Link } from 'react-router-dom';

// The list of products (using your data)
const products = [
  {
    id: 1,
    name: 'AirPods 2',
    price: 999,
    image: './images/ap2_rm.png',
    description: 'Latest model of iPhone with advanced features.'
  },
  {
    id: 2,
    name: 'AirPods 4',
    price: 1999,
    image: './images/ap4_rm.png',
    description: 'Powerful laptop with M1 chip and long battery life.'
  },
  {
    id: 3,
    name: 'AirPods Max',
    price: 699,
    image: './images/apMax_rm.png',
    description: 'Compact camera with 4K recording and Wi-Fi.'
  },
  {
    id: 4,
    name: 'Apple Watch S10',
    price: 499,
    image: './images/awS10_rm.png',
    description: 'Lightweight tablet with a stunning display.'
  },
  {
    id: 5,
    name: 'Apple Watch SE',
    price: 19.99,
    image: './images/awSE_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 6,
    name: 'Apple Watch U2',
    price: 199,
    image: './images/awU2_rm.png',
    description: 'High-quality noise-cancelling headphones.'
  },
  {
    id: 7,
    name: 'iPhone 14',
    price: 19.99,
    image: './images/ip14_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 8,
    name: 'iPhone 15',
    price: 19.99,
    image: './images/ip15_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 9,
    name: 'iPhone 16',
    price: 19.99,
    image: './images/ip16_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 10,
    name: 'iPad',
    price: 19.99,
    image: './images/ipad_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 11,
    name: 'iPad Air',
    price: 19.99,
    image: './images/ipadAir_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 12,
    name: 'iPad Mini',
    price: 19.99,
    image: './images/ipadMini_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 13,
    name: 'iPad Pro',
    price: 19.99,
    image: './images/ipadPro_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 14,
    name: 'Mac 13',
    price: 19.99,
    image: './images/mac13_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 15,
    name: 'Mac 14',
    price: 19.99,
    image: './images/mac14_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 16,
    name: 'Galaxy Z Fold6',
    price: 19.99,
    image: './images/s1_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 17,
    name: 'Galaxy S24 FE',
    price: 19.99,
    image: './images/s2_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 18,
    name: 'Galaxy S24',
    price: 19.99,
    image: './images/s3_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 19,
    name: 'Galaxy A16 5G',
    price: 19.99,
    image: './images/s4_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 20,
    name: '65" Neo QLED 4K QN87D Tizen OS Smart AI TV (2024)',
    price: 19.99,
    image: './images/s6_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 21,
    name: '34" ViewFinity S6 S65TC UWQHD Monitor',
    price: 19.99,
    image: './images/s7_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 22,
    name: 'ZV-1F',
    price: 19.99,
    image: './images/sony1_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 23,
    name: 'ZV-1',
    price: 19.99,
    image: './images/sony2_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 24,
    name: 'RX100 VII Compact Camera, Unrivaled AF',
    price: 19.99,
    image: './images/sony3_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 25,
    name: 'RX0 II premium tiny tough camera',
    price: 19.99,
    image: './images/sony4_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 26,
    name: 'BRAVIA 8',
    price: 19.99,
    image: './images/sony5_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 27,
    name: 'New XPS 13',
    price: 19.99,
    image: './images/D1_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 28,
    name: 'XPS 13',
    price: 19.99,
    image: './images/D2_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 29,
    name: 'XPS 14',
    price: 19.99,
    image: './images/D3_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 30,
    name: 'XPS Desktop',
    price: 19.99,
    image: './images/D4_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 31,
    name: 'OptiPlex Micro Form Factor',
    price: 19.99,
    image: './images/D5_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 32,
    name: 'HP Smart Tank 7301 All-in-One Printer',
    price: 19.99,
    image: './images/HP1_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 33,
    name: 'HP OfficeJet Pro 8135e Wireless All-in-One Printer',
    price: 19.99,
    image: './images/HP2_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 34,
    name: 'HP OfficeJet 200 Mobile Printer',
    price: 19.99,
    image: './images/HP3_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 35,
    name: 'HP 325 FHD Webcam for business',
    price: 19.99,
    image: './images/HP4_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  },
  {
    id: 36,
    name: 'Poly Studio R30 USB Video Bar',
    price: 19.99,
    image: './images/HP5_rm.png',
    description: 'Colorful LED lights for decorating your room.'
  }



];

const Home = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(4); // Number of products per page changed to 4

  // Calculate the index of the last product on the current page
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;

  // Get the current products to display
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  // Calculate the total number of pages
  const totalPages = Math.ceil(products.length / productsPerPage);

  // Handle previous page
  const goToPreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1)); // Ensure we don't go below 1
  };

  // Handle next page
  const goToNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages)); // Ensure we don't go above total pages
  };

  return (
    <div className="home" style={{ paddingBottom: '100px' }}> {/* Added padding for pagination space */}
      <div className="main-container">
        <div className="text-container">
          <h1 className="h1">Welcome to Our Store</h1>
          <p>Explore our products and enjoy the best deals.</p>
          <Link to="/shop">
            <button className="access-button">Shop Now</button>
          </Link>
        </div>
        <div className="image-container">
          <img className="image-style" src="./images/ip16_rm.png" />
        </div>
      </div>

      <div className="products-container">
        {currentProducts.map((product) => (
          <div key={product.id} className="product-card">
            <img className="product-image" src={product.image} alt={product.name} />
            <div className="product-info">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <span>${product.price}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination" style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          className="pagination-button"
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          className="pagination-button"
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Home;
