import React, { useState, useEffect } from 'react';
import {
  Category,
  Service,
  AppSettings,
  OrderSubmissionResult,
  DashboardStats
} from './types';
import {
  getPublicServices,
  getPublicSettings,
  getAdminDashboardStats,
  verifyAdminToken
} from './lib/api';

// Public Components
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { OrderForm } from './components/OrderForm';
import { ServicesCatalog } from './components/ServicesCatalog';
import { HowItWorks } from './components/HowItWorks';
import { SupportSection } from './components/SupportSection';
import { Footer } from './components/Footer';

// Modals
import { PaymentVerificationModal } from './components/PaymentVerificationModal';
import { UpiPaymentModal } from './components/UpiPaymentModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { TrackOrderModal } from './components/TrackOrderModal';

// Admin Components
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminServices } from './components/admin/AdminServices';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminLogs } from './components/admin/AdminLogs';

export default function App() {
  // Navigation & URL-based View Mode
  const getInitialViewMode = (): 'public' | 'admin' => {
    if (typeof window === 'undefined') return 'public';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path === '/admin' || path.startsWith('/admin/') || hash === '#/admin' || hash.startsWith('#/admin/')) {
      return 'admin';
    }
    return 'public';
  };

  const [viewMode, setViewMode] = useState<'public' | 'admin'>(getInitialViewMode);
  const [activeNavSection, setActiveNavSection] = useState<string>('order-section');

  // Public Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  // Modals
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<OrderSubmissionResult | null>(null);
  const [orderSuccessResult, setOrderSuccessResult] = useState<OrderSubmissionResult | null>(null);
  const [prefilledTrackOrderId, setPrefilledTrackOrderId] = useState<string>('');

  // Admin State
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('ayush_admin_token'));
  const [adminUser, setAdminUser] = useState<any>(null);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'orders' | 'services' | 'settings' | 'logs'>('dashboard');
  const [adminStats, setAdminStats] = useState<DashboardStats | null>(null);
  const [adminOrderFilter, setAdminOrderFilter] = useState<string>('all');
  const [adminSelectedOrderId, setAdminSelectedOrderId] = useState<string | null>(null);

  // Listen to browser URL changes (popstate & hashchange)
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || path.startsWith('/admin/') || hash === '#/admin' || hash.startsWith('#/admin/')) {
        setViewMode('admin');
      } else {
        setViewMode('public');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Load Initial Public Data
  useEffect(() => {
    loadPublicData();
  }, []);

  // Check Admin Token Validity on mount or token change & poll stats
  useEffect(() => {
    if (adminToken) {
      verifyAdminToken(adminToken).then(res => {
        if (res.valid && res.user) {
          setAdminUser(res.user);
          loadAdminStats(adminToken);
        } else {
          handleAdminLogout(false);
        }
      }).catch(() => {
        handleAdminLogout(false);
      });

      // Background real-time polling for dashboard stats every 4s
      const statsInterval = setInterval(() => {
        if (adminToken && viewMode === 'admin') {
          loadAdminStats(adminToken);
        }
      }, 4000);

      return () => clearInterval(statsInterval);
    }
  }, [adminToken, viewMode]);

  const loadPublicData = async () => {
    try {
      const [srvRes, setRes] = await Promise.all([
        getPublicServices(),
        getPublicSettings()
      ]);
      if (srvRes.success) {
        setCategories(srvRes.categories || []);
        setServices(srvRes.services || []);
        if (srvRes.services && srvRes.services.length > 0 && !selectedServiceId) {
          setSelectedServiceId(srvRes.services[0].service_id);
        }
      }
      if (setRes.success && setRes.settings) {
        setSettings(setRes.settings);
      }
    } catch (err) {
      console.error('Failed to load public data:', err);
    }
  };

  const loadAdminStats = async (token: string) => {
    try {
      const res = await getAdminDashboardStats(token);
      if (res.success && res.stats) {
        setAdminStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  };

  const handleAdminLoginSuccess = (token: string, user: any) => {
    localStorage.setItem('ayush_admin_token', token);
    setAdminToken(token);
    setAdminUser(user);
    loadAdminStats(token);
  };

  const handleAdminLogout = (redirectToPublic: boolean = false) => {
    localStorage.removeItem('ayush_admin_token');
    setAdminToken(null);
    setAdminUser(null);
    if (redirectToPublic) {
      if (window.location.pathname === '/admin') {
        window.history.pushState({}, '', '/');
      }
      setViewMode('public');
    }
  };

  const navigateToPublicSite = () => {
    if (window.location.pathname === '/admin') {
      window.history.pushState({}, '', '/');
    }
    setViewMode('public');
  };

  const scrollToSection = (sectionId: string) => {
    setActiveNavSection(sectionId);
    if (viewMode !== 'public') {
      navigateToPublicSite();
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectServiceFromCatalog = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    scrollToSection('order-section');
  };

  const handleOrderSuccess = (result: OrderSubmissionResult) => {
    // 59-second live timer verification pop-up appears immediately
    setVerificationResult(result);
  };

  const handleViewReceiptFromVerification = () => {
    if (verificationResult) {
      setOrderSuccessResult(verificationResult);
      setVerificationResult(null);
    }
  };

  const handleTrackFromVerification = (orderId: string) => {
    setVerificationResult(null);
    setPrefilledTrackOrderId(orderId);
    setIsTrackModalOpen(true);
  };

  const handleTrackFromSuccessModal = (orderId: string) => {
    setOrderSuccessResult(null);
    setPrefilledTrackOrderId(orderId);
    setIsTrackModalOpen(true);
  };

  // ========================================================
  // RENDER ADMIN PANEL (URL: /admin)
  // ========================================================
  if (viewMode === 'admin') {
    // Unauthenticated: Redirect/Display secure Admin Login
    if (!adminToken || !adminUser) {
      return (
        <AdminLogin
          onLoginSuccess={handleAdminLoginSuccess}
          onBackToPublic={navigateToPublicSite}
        />
      );
    }

    // Authenticated: Render Private Dashboard
    return (
      <AdminLayout
        token={adminToken}
        currentTab={adminTab}
        onTabChange={(tab) => {
          setAdminTab(tab);
          if (tab === 'dashboard') loadAdminStats(adminToken);
        }}
        adminUser={adminUser}
        onLogout={() => handleAdminLogout(false)}
        onViewPublicSite={navigateToPublicSite}
      >
        {adminTab === 'dashboard' && (
          <AdminDashboard
            stats={adminStats}
            onNavigateToOrders={(filter) => {
              setAdminOrderFilter(filter || 'all');
              setAdminTab('orders');
            }}
            onViewOrder={(orderId) => {
              setAdminSelectedOrderId(orderId);
              setAdminTab('orders');
            }}
            onNavigateToServices={() => setAdminTab('services')}
          />
        )}

        {adminTab === 'orders' && (
          <AdminOrders
            token={adminToken}
            categories={categories}
            initialStatusFilter={adminOrderFilter}
            selectedOrderIdToOpen={adminSelectedOrderId}
            onClearSelectedOrderId={() => setAdminSelectedOrderId(null)}
          />
        )}

        {adminTab === 'services' && (
          <AdminServices token={adminToken} />
        )}

        {adminTab === 'settings' && (
          <AdminSettings token={adminToken} />
        )}

        {adminTab === 'logs' && (
          <AdminLogs token={adminToken} />
        )}
      </AdminLayout>
    );
  }

  // ========================================================
  // RENDER PUBLIC WEBSITE (Default)
  // ========================================================
  const upiId = settings?.upi_id || '7033994688-4@ybl';
  const merchantName = settings?.merchant_name || 'Shilpi Devi';
  const announcement = settings?.announcement_banner || '⚡ Direct SMM fulfillment by ayushXsisi. High quality & instant dispatch.';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-amber-500 selection:text-neutral-950 font-sans">
      {/* Top Sticky Navigation (No Admin Buttons) */}
      <Navbar
        onOpenTrackModal={() => {
          setPrefilledTrackOrderId('');
          setIsTrackModalOpen(true);
        }}
        onOpenUpiModal={() => setIsUpiModalOpen(true)}
        activeSection={activeNavSection}
        onSectionClick={scrollToSection}
      />

      {/* Main Hero Header */}
      <HeroSection
        announcement={announcement}
        onOrderNowClick={() => scrollToSection('order-section')}
        onBrowseServicesClick={() => scrollToSection('services-section')}
      />

      {/* 1. Core Order Collection Form */}
      <OrderForm
        categories={categories}
        services={services}
        selectedServiceId={selectedServiceId}
        onSelectServiceId={setSelectedServiceId}
        upiId={upiId}
        merchantName={merchantName}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* 2. Services & Transparent Pricing Catalog */}
      <ServicesCatalog
        categories={categories}
        services={services}
        onSelectService={handleSelectServiceFromCatalog}
      />

      {/* 3. How It Works - 4 Steps */}
      <HowItWorks />

      {/* 4. Support & Direct WhatsApp FAQ */}
      <SupportSection />

      {/* Footer (No Admin Links) */}
      <Footer
        onSectionClick={scrollToSection}
      />

      {/* ======================================================== */}
      {/* INTERACTIVE MODALS */}
      {/* ======================================================== */}

      {/* UPI QR & Payment Info Modal */}
      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        upiId={upiId}
        merchantName={merchantName}
      />

      {/* Order Track Modal */}
      <TrackOrderModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        initialOrderId={prefilledTrackOrderId}
      />

      {/* 59-Second Graphic Payment Verification Pop-up Modal */}
      {verificationResult && (
        <PaymentVerificationModal
          orderResult={verificationResult}
          onClose={() => setVerificationResult(null)}
          onViewReceipt={handleViewReceiptFromVerification}
          onTrackOrder={handleTrackFromVerification}
        />
      )}

      {/* Order Placed Success Modal */}
      {orderSuccessResult && (
        <OrderSuccessModal
          result={orderSuccessResult}
          onClose={() => setOrderSuccessResult(null)}
          onTrackOrder={handleTrackFromSuccessModal}
        />
      )}
    </div>
  );
}
