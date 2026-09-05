import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import FloatingCartBar from './components/cart/FloatingCartBar';
import WhatsAppFloatingButton from './components/common/WhatsAppFloatingButton';
import LoginModal from './components/auth/LoginModal';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Customer Storefront Pages (Lazy Loaded for fast initial load)
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const SafetyPage = lazy(() => import('./pages/SafetyPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

// Admin Portal Pages
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));

const PageFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <LoadingSpinner text="Loading Sivakasi Crackers..." />
  </div>
);

const App = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-festival-dark text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Customer Storefront Shell */}
      {!isAdminRoute && (
        <>
          <Navbar />
          <CartDrawer />
          <FloatingCartBar />
          <WhatsAppFloatingButton />
          <LoginModal />
        </>
      )}

      {/* Main Routing Views */}
      <main className="flex-1 pb-16 sm:pb-20">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public Customer Storefront Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
            <Route path="/track-order" element={<OrderTrackingPage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Protected Customer Routes */}
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Portal Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin" element={<AdminLoginPage />} />

            {/* Fallback */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Customer Footer */}
      {!isAdminRoute && <Footer />}
    </div>
  );
};

export default App;
