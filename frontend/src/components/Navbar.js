import React from "react";
import { useAuth } from "../contexts/AuthContext";

const Navbar = ({ onShowDashboard }) => {
  const { user, logout } = useAuth();

  return (
    <nav>
      <a href="/">Accueil</a>
      {user ? (
        <>
          <button onClick={onShowDashboard}>Mon compte</button>
          <button onClick={logout}>Déconnexion</button>
        </>
      ) : (
        <span>Veuillez vous connecter</span>
      )}
    </nav>
  );
};

export default Navbar;