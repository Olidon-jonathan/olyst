import React from "react";

const Referral = ({ user }) => {
  const referralLink = `https://olyst.com/?ref=${user.referralCode}`;
  return (
    <div className="referral-section">
      <h3>Parrainez vos amis !</h3>
      <p>
        Partagez ce lien et gagnez des récompenses pour chaque nouvel utilisateur inscrit :
      </p>
      <input type="text" value={referralLink} readOnly style={{ width: "100%" }} />
      <button onClick={() => navigator.clipboard.writeText(referralLink)}>
        Copier le lien
      </button>
    </div>
  );
};

export default Referral;