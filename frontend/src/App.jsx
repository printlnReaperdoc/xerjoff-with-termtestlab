import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Sales from './pages/Sales';
import ManageProducts from './pages/ManageProducts';
import ManageTransactions from './pages/ManageTransactions';
import ManageReviews from './pages/ManageReviews';
import Cart from './pages/Cart';
import Header from './Header';

export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/sales" element={<Sales />} />
        <Route path="/admin/products" element={<ManageProducts />} />
        <Route path="/admin/transactions" element={<ManageTransactions />} />
        <Route path="admin/reviews" element={<ManageReviews />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </Router>
  );
}