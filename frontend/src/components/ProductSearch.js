import React, { useState } from "react";
import ProductSearch from "./components/ProductSearch";
import ProductReview from "./ProductReview";

const ProductPage = ({ products }) => {
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [reviews, setReviews] = useState({}); // { productId: [ {rating, comment}, ... ] }

  const handleAddReview = (review) => {
    setReviews((prev) => ({
      ...prev,
      [review.productId]: [...(prev[review.productId] || []), review],
    }));
  };

  return (
    <div className="product-page">
      <ProductSearch products={products} onFilter={setFilteredProducts} />
      <div className="product-list">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-item">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <span>{product.price} €</span>
            <ProductReview
              productId={product.id}
              reviews={reviews[product.id] || []}
              onAddReview={handleAddReview}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductPage;