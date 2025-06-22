import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import axios from "axios";
import { 
  FiHome, FiShoppingBag, FiInfo, FiMail, FiUser, FiLogOut, FiLogIn, FiUserPlus,
  FiSearch, FiFilter, FiShoppingCart, FiDownload, FiEdit, FiTrash2, FiPlus,
  FiBook, FiLayout, FiMusic, FiVideo, FiCpu, FiCheck, FiX, FiUpload
} from 'react-icons/fi';
import { 
  HiOutlineSparkles, HiOutlineLightBulb, HiOutlineShieldCheck 
} from 'react-icons/hi';
import { 
  BiSolidDashboard 
} from 'react-icons/bi';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      logout();
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Erreur de connexion' };
    }
  };

  const register = async (email, username, password) => {
    try {
      const response = await axios.post(`${API}/auth/register`, { email, username, password });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Erreur d\'inscription' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// Components
const Navbar = () => {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo" onClick={() => setCurrentPage('home')}>
          <h2>Olyst</h2>
        </div>
        <div className="nav-links">
          <button 
            className={currentPage === 'home' ? 'nav-link active' : 'nav-link'}
            onClick={() => setCurrentPage('home')}
          >
            <FiHome /> Accueil
          </button>
          <button 
            className={currentPage === 'products' ? 'nav-link active' : 'nav-link'}
            onClick={() => setCurrentPage('products')}
          >
            <FiShoppingBag /> Produits
          </button>
          <button 
            className={currentPage === 'about' ? 'nav-link active' : 'nav-link'}
            onClick={() => setCurrentPage('about')}
          >
            <FiInfo /> À propos
          </button>
          <button 
            className={currentPage === 'contact' ? 'nav-link active' : 'nav-link'}
            onClick={() => setCurrentPage('contact')}
          >
            <FiMail /> Contact
          </button>
        </div>
        <div className="nav-auth">
          {user ? (
            <div className="nav-user">
              <span><FiUser /> Bonjour, {user.username}</span>
              {user.is_admin && (
                <button 
                  className="nav-link admin"
                  onClick={() => setCurrentPage('admin')}
                >
                  <BiSolidDashboard /> Admin
                </button>
              )}
              <button className="btn-logout" onClick={logout}>
                <FiLogOut /> Déconnexion
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button 
                className="btn-login"
                onClick={() => setCurrentPage('login')}
              >
                <FiLogIn /> Connexion
              </button>
              <button 
                className="btn-register"
                onClick={() => setCurrentPage('register')}
              >
                <FiUserPlus /> Inscription
              </button>
            </div>
          )}
        </div>
      </div>
      <Router currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </nav>
  );
};

const Router = ({ currentPage, setCurrentPage }) => {
  switch (currentPage) {
    case 'home':
      return <HomePage setCurrentPage={setCurrentPage} />;
    case 'products':
      return <ProductsPage setCurrentPage={setCurrentPage} />;
    case 'about':
      return <AboutPage />;
    case 'contact':
      return <ContactPage />;
    case 'login':
      return <LoginPage setCurrentPage={setCurrentPage} />;
    case 'register':
      return <RegisterPage setCurrentPage={setCurrentPage} />;
    case 'admin':
      return <AdminPage />;
    default:
      return <HomePage setCurrentPage={setCurrentPage} />;
  }
};

const HomePage = ({ setCurrentPage }) => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchFeaturedProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setFeaturedProducts(response.data.slice(0, 6));
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Bienvenue sur Olyst</h1>
            <p>Votre marketplace de produits digitaux premium</p>
            <p>Découvrez une sélection exclusive d'e-books, templates, contenus audio/vidéo et outils IA</p>
            <button 
              className="btn-hero"
              onClick={() => setCurrentPage('products')}
            >
              <FiShoppingBag /> Découvrir nos produits
            </button>
          </div>
          <div className="hero-image">
            <img 
              src="https://images.pexels.com/photos/8728559/pexels-photo-8728559.jpeg" 
              alt="Digital Products"
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2>Nos Catégories</h2>
        <div className="categories-grid">
          {categories.map(category => {
            const getCategoryIcon = (categoryId) => {
              switch(categoryId) {
                case 'ebooks': return <FiBook />;
                case 'templates': return <FiLayout />;
                case 'audio': return <FiMusic />;
                case 'videos': return <FiVideo />;
                case 'ai_packs': return <FiCpu />;
                default: return <FiShoppingBag />;
              }
            };

            return (
              <div key={category.id} className="category-card">
                <div className="category-icon">
                  {getCategoryIcon(category.id)}
                </div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="featured-section">
          <h2>Produits Populaires</h2>
          <div className="products-grid">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const ProductsPage = ({ setCurrentPage }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory, searchTerm]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await axios.get(`${API}/products?${params}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
    setLoading(false);
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>Nos Produits</h1>
        
        <div className="products-filters">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="category-filter">
            <FiFilter className="filter-icon" />
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="products-grid">
        {products.length > 0 ? (
          products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className="no-products">
            <p>Aucun produit trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <div className="product-image">
        {product.image_base64 ? (
          <img src={`data:image/jpeg;base64,${product.image_base64}`} alt={product.name} />
        ) : (
          <div className="placeholder-image">
            <FiShoppingBag />
          </div>
        )}
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">{product.price}€</span>
          <button className="btn-buy">
            <FiShoppingCart /> Acheter
          </button>
        </div>
      </div>
    </div>
  );
};

const LoginPage = ({ setCurrentPage }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    if (result.success) {
      setCurrentPage('home');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Connexion</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit">Se connecter</button>
        </form>
        <p>
          Pas de compte ? 
          <button className="link-btn" onClick={() => setCurrentPage('register')}>
            S'inscrire
          </button>
        </p>
      </div>
    </div>
  );
};

const RegisterPage = ({ setCurrentPage }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({ email: '', username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(formData.email, formData.username, formData.password);
    if (result.success) {
      setCurrentPage('home');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Inscription</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit">S'inscrire</button>
        </form>
        <p>
          Déjà un compte ? 
          <button className="link-btn" onClick={() => setCurrentPage('login')}>
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
};

const AdminPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    if (user?.is_admin) {
      fetchAdminProducts();
    }
  }, [user]);

  const fetchAdminProducts = async () => {
    try {
      const response = await axios.get(`${API}/admin/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (!user?.is_admin) {
    return <div className="error-page">Accès non autorisé</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Administration</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          <FiPlus /> Ajouter un produit
        </button>
      </div>

      {showForm && (
        <ProductForm 
          product={editingProduct}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            fetchAdminProducts();
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      <div className="admin-products">
        <h2>Gestion des produits</h2>
        <div className="products-table">
          {products.map(product => (
            <div key={product.id} className="product-row">
              <div className="product-info">
                <h3>{product.name}</h3>
                <p>{product.price}€ - {product.category}</p>
                <p className={product.is_active ? 'active' : 'inactive'}>
                  {product.is_active ? 'Actif' : 'Inactif'}
                </p>
              </div>
              <div className="product-actions">
                <button 
                  onClick={() => {
                    setEditingProduct(product);
                    setShowForm(true);
                  }}
                >
                  <FiEdit /> Modifier
                </button>
                <button 
                  onClick={() => deleteProduct(product.id)}
                  className="btn-danger"
                >
                  <FiTrash2 /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  async function deleteProduct(productId) {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await axios.delete(`${API}/products/${productId}`);
        fetchAdminProducts();
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  }
};

const ProductForm = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category || 'ebooks',
    image_base64: product?.image_base64 || '',
    file_base64: product?.file_base64 || '',
    file_name: product?.file_name || '',
    file_type: product?.file_type || ''
  });

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        if (type === 'image') {
          setFormData({...formData, image_base64: base64});
        } else {
          setFormData({
            ...formData, 
            file_base64: base64,
            file_name: file.name,
            file_type: file.type
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (product) {
        await axios.put(`${API}/products/${product.id}`, formData);
      } else {
        await axios.post(`${API}/products`, formData);
      }
      onSave();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{product ? 'Modifier' : 'Ajouter'} un produit</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nom du produit"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Prix"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            required
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            <option value="ebooks">E-books</option>
            <option value="templates">Templates</option>
            <option value="audio">Audio</option>
            <option value="videos">Vidéos</option>
            <option value="ai_packs">Packs IA</option>
          </select>
          
          <label>Image du produit:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'image')}
          />
          
          <label>Fichier produit:</label>
          <input
            type="file"
            onChange={(e) => handleFileChange(e, 'file')}
          />
          
          <div className="form-actions">
            <button type="button" onClick={onClose}>Annuler</button>
            <button type="submit">Sauvegarder</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AboutPage = () => (
  <div className="page-content">
    <div className="about-section">
      <h1>À propos d'Olyst</h1>
      <div className="about-content">
        <img 
          src="https://images.pexels.com/photos/7789851/pexels-photo-7789851.jpeg" 
          alt="About Olyst"
          className="about-image"
        />
        <div className="about-text">
          <h2>Créé par Olidon Jonathan</h2>
          <p>
            Olyst est né de la passion pour les produits digitaux de qualité. 
            Notre mission est de vous offrir une sélection exclusive de contenus 
            numériques premium : e-books, templates créatifs, contenus audio et vidéo, 
            ainsi que des outils d'intelligence artificielle innovants.
          </p>
          <p>
            Chaque produit est soigneusement sélectionné pour sa qualité et sa valeur ajoutée, 
            garantissant une expérience utilisateur exceptionnelle.
          </p>
          <div className="features">
            <div className="feature">
              <HiOutlineShieldCheck />
              <h3>Sécurisé</h3>
              <p>Paiements et téléchargements sécurisés</p>
            </div>
            <div className="feature">
              <HiOutlineSparkles />
              <h3>Instantané</h3>
              <p>Accès immédiat après achat</p>
            </div>
            <div className="feature">
              <HiOutlineLightBulb />
              <h3>Qualité</h3>
              <p>Produits sélectionnés avec soin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simuler l'envoi
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="page-content">
      <div className="contact-section">
        <h1>Contactez-nous</h1>
        <div className="contact-content">
          <div className="contact-info">
            <h2>Besoin d'aide ?</h2>
            <p>N'hésitez pas à nous contacter pour toute question ou suggestion.</p>
            <div className="contact-details">
              <p>📧 contact@olyst.com</p>
              <p>🌍 Disponible 24h/24</p>
            </div>
          </div>
          
          <form className="contact-form" onSubmit={handleSubmit}>
            <h3>Envoyez-nous un message</h3>
            <input
              type="text"
              placeholder="Votre nom"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <input
              type="email"
              placeholder="Votre email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            <textarea
              placeholder="Votre message"
              rows="5"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              required
            />
            <button type="submit">Envoyer</button>
            
            {submitted && (
              <div className="success-message">
                Message envoyé avec succès ! Nous vous répondrons bientôt.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
      </div>
    </AuthProvider>
  );
}

export default App;