import React from "react";
import Referral from "./Referral";

const UserDashboard = ({ user, purchases }) => (
  <div>
    <h2>Bienvenue, {user.name} !</h2>
    <h3>Vos achats</h3>
    {purchases.length === 0 ? (
      <p>Aucun achat pour le moment.</p>
    ) : (
      <ul>
        {purchases.map((item) => (
          <li key={item.id}>
            {item.productName} — {item.date}
            <a href={item.downloadUrl} download>
              <button>Télécharger</button>
            </a>
          </li>
        ))}
      </ul>
    )}
    <Referral user={user} />
  </div>
);

export default UserDashboard;