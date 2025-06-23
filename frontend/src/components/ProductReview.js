import React, { useState } from "react";

const ProductReview = ({ productId, reviews = [], onAddReview }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating && comment) {
      onAddReview({ productId, rating, comment });
      setRating(0);
      setComment("");
    }
  };

  return (
    <div className="product-review">
      <h4>Avis des utilisateurs</h4>
      {reviews.length === 0 && <p>Aucun avis pour ce produit.</p>}
      <ul>
        {reviews.map((r, idx) => (
          <li key={idx}>
            <strong>Note :</strong> {r.rating} / 5<br />
            <em>{r.comment}</em>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <label>
          Note :
          <select value={rating} onChange={e => setRating(Number(e.target.value))}>
            <option value={0}>Choisir</option>
            {[1,2,3,4,5].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <br />
        <textarea
          placeholder="Votre avis..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          required
        />
        <br />
        <button type="submit">Envoyer</button>
      </form>
    </div>
  );
};

export default ProductReview;