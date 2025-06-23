import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const LoginForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Génère un code de parrainage simple
    const referralCode = name.toLowerCase().replace(/\s/g, "") + Math.floor(Math.random() * 10000);
    login({ name, email, referralCode });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Connexion</h2>
      <input
        type="text"
        placeholder="Nom"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <button type="submit">Se connecter</button>
    </form>
  );
};

export default LoginForm;