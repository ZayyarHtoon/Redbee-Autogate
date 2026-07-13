/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Users, 
  ShoppingBag, 
  Settings, 
  LayoutDashboard,
  LogOut,
  Clock,
  Plus,
  Trash2
} from 'lucide-react';

import { CompanyProfile, Client, Product, Document, DocumentStatus } from './types';
import { 
  DEFAULT_COMPANY_PROFILE, 
  DEFAULT_CLIENTS, 
  DEFAULT_PRODUCTS, 
  DEFAULT_DOCUMENTS, 
  loadFromStorage, 
  saveToStorage 
} from './data';

import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  logoutUser,
  isCollectionEmpty,
  seedInitialData,
  listenToCompanyProfile,
  listenToClients,
  listenToProducts,
  listenToDocuments,
  saveCompanyProfileToCloud,
  saveClientToCloud,
  deleteClientFromCloud,
  saveProductToCloud,
  deleteProductFromCloud,
  saveDocumentToCloud,
  deleteDocumentFromCloud,
  saveMultipleProductsToCloud
} from './firebaseService';

import DashboardHome from './components/DashboardHome';
import DocumentsList from './components/DocumentsList';
import DocumentBuilder, { generateNextDocNumber } from './components/DocumentBuilder';
import ClientsList from './components/ClientsList';
import ProductsList from './components/ProductsList';
import CompanySettings from './components/CompanySettings';
import DocumentView from './components/DocumentView';
import LoginView from './components/LoginView';

export default function App() {
  // --- CORE STATE ---
  const [profile, setProfile] = useState<CompanyProfile>(() => 
    loadFromStorage<CompanyProfile>('r_company_profile', DEFAULT_COMPANY_PROFILE)
  );
  
  const [clients, setClients] = useState<Client[]>(() => 
    loadFromStorage<Client[]>('r_clients', DEFAULT_CLIENTS)
  );

  const [products, setProducts] = useState<Product[]>(() => 
    loadFromStorage<Product[]>('r_products', DEFAULT_PRODUCTS)
  );

  const [documents, setDocuments] = useState<Document[]>(() => 
    loadFromStorage<Document[]>('r_documents', DEFAULT_DOCUMENTS)
  );

  // --- AUTH STATES ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(() => 
    loadFromStorage<boolean>('r_is_guest_mode', false)
  );

  // Keep track of auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        setIsGuestMode(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setIsGuestMode(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    saveToStorage('r_is_guest_mode', isGuestMode);
  }, [isGuestMode]);

  // --- NAVIGATION STATE ---
  // Active Tab: 'dashboard' | 'documents' | 'clients' | 'products' | 'settings'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // View states for nested tasks: 'list' | 'create-edit' | 'view'
  const [docSubView, setDocSubView] = useState<'list' | 'create-edit' | 'view'>('list');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  // --- CUSTOM DELETE CONFIRMATION STATE ---
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'document' | 'client' | 'product' | null;
    id: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: null,
    id: '',
    title: '',
    message: '',
  });

  // Sync to local storage
  useEffect(() => {
    saveToStorage('r_company_profile', profile);
  }, [profile]);

  useEffect(() => {
    saveToStorage('r_clients', clients);
  }, [clients]);

  useEffect(() => {
    saveToStorage('r_products', products);
  }, [products]);

  useEffect(() => {
    saveToStorage('r_documents', documents);
  }, [documents]);

  // Sync all documents with the latest global company profile
  useEffect(() => {
    setDocuments(prevDocs => prevDocs.map(d => {
      if (JSON.stringify(d.companyProfile) !== JSON.stringify(profile)) {
        return { ...d, companyProfile: profile };
      }
      return d;
    }));
  }, [profile]);

  // One-time automatic migration of existing states to MMK (Myanmar Kyat) for localized default experience
  useEffect(() => {
    if (profile.currency !== 'MMK') {
      const updatedProfile = {
        ...profile,
        currency: 'MMK',
        email: profile.email === 'info@redbeeautogate.com' ? 'redbeeautogate@gmail.com' : profile.email,
        phone: profile.phone === '+60 12-345 6789' ? '+95 9 123 456 789' : profile.phone,
        address: profile.address.includes('Puchong') ? 'Yangon, Myanmar' : profile.address,
        bankName: profile.bankName === 'Maybank Berhad' ? 'KBZ Bank' : profile.bankName,
        bankAccount: profile.bankAccount === '5123 4567 8901' ? '1234 5678 9012' : profile.bankAccount,
        bankHolder: profile.bankHolder === 'Redbee Autogate & Security Sdn Bhd' ? 'Redbee Autogate & Security' : profile.bankHolder,
      };
      setProfile(updatedProfile);

      setProducts(prevProducts => prevProducts.map(p => {
        if (p.unitPrice < 5000) {
          return { ...p, unitPrice: p.unitPrice * 1000 };
        }
        return p;
      }));

      setDocuments(prevDocs => prevDocs.map(d => {
        const updatedCompany = d.companyProfile.currency !== 'MMK' ? updatedProfile : d.companyProfile;
        const updatedItems = d.items.map(item => {
          if (item.unitPrice < 5000) {
            return { ...item, unitPrice: item.unitPrice * 1000 };
          }
          return item;
        });
        const updatedDiscountValue = (d.discountType === 'flat' && d.discountValue < 5000) ? d.discountValue * 1000 : d.discountValue;
        const updatedShipping = d.shipping < 5000 ? d.shipping * 1000 : d.shipping;

        return {
          ...d,
          discountValue: updatedDiscountValue,
          shipping: updatedShipping,
          items: updatedItems,
          companyProfile: updatedCompany
        };
      }));
    }
  }, []);

  // --- REAL-TIME FIRESTORE SYNC ---
  const [isSyncingWithCloud, setIsSyncingWithCloud] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setIsSyncingWithCloud(false);
      return;
    }

    setIsSyncingWithCloud(true);
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeClients: (() => void) | null = null;
    let unsubscribeProducts: (() => void) | null = null;
    let unsubscribeDocs: (() => void) | null = null;

    async function initSync() {
      if (!currentUser) return;
      const uid = currentUser.uid;
      try {
        const isProfileEmpty = await isCollectionEmpty(uid, 'profile');
        const isClientsEmpty = await isCollectionEmpty(uid, 'clients');
        const isProductsEmpty = await isCollectionEmpty(uid, 'products');
        const isDocsEmpty = await isCollectionEmpty(uid, 'documents');

        if (isProfileEmpty && isClientsEmpty && isProductsEmpty && isDocsEmpty) {
          // Empty cloud db, upload local state as seed
          await seedInitialData(uid, profile, clients, products, documents);
        }

        // Establish real-time sync listeners
        unsubscribeProfile = listenToCompanyProfile(uid, (updatedProfile) => {
          if (updatedProfile) {
            setProfile(updatedProfile);
          }
        });

        unsubscribeClients = listenToClients(uid, (updatedClients) => {
          if (updatedClients) {
            setClients(updatedClients);
          }
        });

        unsubscribeProducts = listenToProducts(uid, (updatedProducts) => {
          if (updatedProducts) {
            setProducts(updatedProducts);
          }
        });

        unsubscribeDocs = listenToDocuments(uid, (updatedDocs) => {
          if (updatedDocs) {
            const sorted = [...updatedDocs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setDocuments(sorted);
          }
        });

        setIsSyncingWithCloud(false);
      } catch (err) {
        console.error('Error initializing real-time database:', err);
        setIsSyncingWithCloud(false);
      }
    }

    initSync();

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeClients) unsubscribeClients();
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeDocs) unsubscribeDocs();
    };
  }, [currentUser]);

  // --- HANDLERS: CLIENT REGISTRY ---
  const handleAddClient = (newClient: Client) => {
    setClients(prev => [newClient, ...prev]);
    if (currentUser) {
      saveClientToCloud(currentUser.uid, newClient);
    }
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    if (currentUser) {
      saveClientToCloud(currentUser.uid, updatedClient);
    }
  };

  const handleDeleteClient = (id: string) => {
    const client = clients.find(c => c.id === id);
    setDeleteConfirm({
      isOpen: true,
      type: 'client',
      id,
      title: 'Remove Client',
      message: `Are you sure you want to remove client "${client?.name || 'this client'}"? Historic invoices/quotations for this client will be preserved.`,
    });
  };

  // --- HANDLERS: PRODUCT CATALOG ---
  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
    if (currentUser) {
      saveProductToCloud(currentUser.uid, newProduct);
    }
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    if (currentUser) {
      saveProductToCloud(currentUser.uid, updatedProduct);
    }
  };

  const handleDeleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    setDeleteConfirm({
      isOpen: true,
      type: 'product',
      id,
      title: 'Delete Catalog Item',
      message: `Are you sure you want to delete "${product?.name || 'this product/service'}" from the catalog?`,
    });
  };

  const handleBulkSyncProducts = async (newProducts: Product[], replace: boolean) => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    if (replace) {
      // Clear all products first
      for (const p of products) {
        await deleteProductFromCloud(uid, p.id);
      }
      setProducts(newProducts);
      await saveMultipleProductsToCloud(uid, newProducts);
    } else {
      // Merge: update by name or append
      const merged = [...products];
      const toSaveCloud: Product[] = [];
      newProducts.forEach(newP => {
        const existingIdx = merged.findIndex(p => p.name.toLowerCase() === newP.name.toLowerCase());
        if (existingIdx > -1) {
          merged[existingIdx] = { ...merged[existingIdx], ...newP, id: merged[existingIdx].id };
          toSaveCloud.push(merged[existingIdx]);
        } else {
          merged.push(newP);
          toSaveCloud.push(newP);
        }
      });
      setProducts(merged);
      await saveMultipleProductsToCloud(uid, toSaveCloud);
    }
  };

  // --- HANDLERS: QUOTATION & INVOICE OPERATIONS ---
  const handleSaveDocument = (savedDoc: Document) => {
    setDocuments(prev => {
      const exists = prev.some(d => d.id === savedDoc.id);
      if (exists) {
        return prev.map(d => d.id === savedDoc.id ? savedDoc : d);
      } else {
        return [savedDoc, ...prev];
      }
    });
    if (currentUser) {
      saveDocumentToCloud(currentUser.uid, savedDoc);
    }
    setDocSubView('list');
    setActiveDocId(null);
  };

  const handleDeleteDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    setDeleteConfirm({
      isOpen: true,
      type: 'document',
      id,
      title: `Delete ${doc?.type === 'invoice' ? 'Invoice' : 'Quotation'}`,
      message: `Are you sure you want to permanently delete document ${doc?.number || ''}? This action cannot be undone.`,
    });
  };

  const confirmDelete = () => {
    const { type, id } = deleteConfirm;
    if (!type || !id) return;

    if (type === 'document') {
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (currentUser) {
        deleteDocumentFromCloud(currentUser.uid, id);
      }
      if (activeDocId === id) {
        setDocSubView('list');
        setActiveDocId(null);
      }
    } else if (type === 'client') {
      setClients(prev => prev.filter(c => c.id !== id));
      if (currentUser) {
        deleteClientFromCloud(currentUser.uid, id);
      }
    } else if (type === 'product') {
      setProducts(prev => prev.filter(p => p.id !== id));
      if (currentUser) {
        deleteProductFromCloud(currentUser.uid, id);
      }
    }

    setDeleteConfirm({
      isOpen: false,
      type: null,
      id: '',
      title: '',
      message: '',
    });
  };

  const handleUpdateDocumentStatus = (id: string, newStatus: DocumentStatus) => {
    setDocuments(prev => prev.map(d => {
      if (d.id === id) {
        const updated = { ...d, status: newStatus };
        if (currentUser) {
          saveDocumentToCloud(currentUser.uid, updated);
        }
        return updated;
      }
      return d;
    }));
  };

  // High-value Flow: Convert Accepted Quotation to tax Invoice
  const handleConvertQuotationToInvoice = (quotationId: string) => {
    const quotation = documents.find(d => d.id === quotationId && d.type === 'quotation');
    if (!quotation) return;

    const invoiceId = 'doc-' + Date.now();
    const now = new Date();
    const invoiceNo = generateNextDocNumber(documents, 'invoice');
    const todayStr = now.toISOString().split('T')[0];

    const fourteenDaysLater = new Date();
    fourteenDaysLater.setDate(now.getDate() + 14);
    const dueStr = fourteenDaysLater.toISOString().split('T')[0];

    const convertedInvoice: Document = {
      ...quotation,
      id: invoiceId,
      type: 'invoice',
      number: invoiceNo,
      date: todayStr,
      dueDate: dueStr,
      status: 'sent',
      convertedFromQuotationId: quotationId,
      // Fresh snapshot of profile
      companyProfile: profile,
      notes: `Invoice converted from Quotation ${quotation.number}. Completed on-site installation. Thank you for your business!`
    };

    setDocuments(prev => {
      // Mark quotation as converted
      const updatedDocs = prev.map(d => {
        if (d.id === quotationId) {
          const updatedQuotation = { ...d, convertedToInvoiceId: invoiceId };
          if (currentUser) {
            saveDocumentToCloud(currentUser.uid, updatedQuotation);
          }
          return updatedQuotation;
        }
        return d;
      });
      if (currentUser) {
        saveDocumentToCloud(currentUser.uid, convertedInvoice);
      }
      return [convertedInvoice, ...updatedDocs];
    });

    // Directly open the converted invoice
    setActiveDocId(invoiceId);
    setDocSubView('view');
    setActiveTab('documents');
  };

  // Navigation Shortcut: Create doc directly pre-filled for a specific client
  const handleCreateDocForClient = (clientId: string, type: 'quotation' | 'invoice') => {
    // Generate empty document template
    setActiveDocId(null);
    setDocSubView('create-edit');
    setActiveTab('documents');
    
    // Pass the clientId by setting a state or handling it in DocumentBuilder
    // Since we handle init in DocumentBuilder, we can just temporarily override
    // activeDocId to contain a marker, or handle it simply:
    // Let's create an ephemeral custom template
    const now = new Date();
    const rand = Math.floor(100 + Math.random() * 900);
    const prefix = type === 'invoice' ? 'INV' : 'QT';
    const todayStr = now.toISOString().split('T')[0];

    const fourteenDaysLater = new Date();
    fourteenDaysLater.setDate(now.getDate() + 14);
    const dueStr = fourteenDaysLater.toISOString().split('T')[0];

    const tempDoc: Document = {
      id: 'doc-temp-client-fill',
      type: type,
      number: `${prefix}-${now.getFullYear()}-${rand}`,
      date: todayStr,
      dueDate: dueStr,
      clientId: clientId,
      items: [
        {
          id: 'item-temp-0',
          description: '',
          quantity: 1,
          unitPrice: 0,
          taxRate: profile.defaultTaxRate,
        }
      ],
      discountType: 'flat',
      discountValue: 0,
      shipping: 0,
      notes: type === 'invoice' 
        ? 'Payment terms: Within 14 days of invoice date. Thank you!' 
        : 'Quotation valid for 30 days. Standard installation included.',
      status: 'draft',
      companyProfile: profile,
    };

    // We can save this temp doc briefly, or we can just pass it directly.
    // Let's save it briefly as a draft in state, and edit it!
    setDocuments(prev => [tempDoc, ...prev]);
    setActiveDocId(tempDoc.id);
    setDocSubView('create-edit');
  };

  const handleCreateFreshDoc = (type: 'quotation' | 'invoice') => {
    setActiveDocId(null);
    setDocSubView('create-edit');
    setActiveTab('documents');
  };

  const currentActiveDoc = documents.find(d => d.id === activeDocId);
  const docClient = currentActiveDoc ? clients.find(c => c.id === currentActiveDoc.clientId) : null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase font-mono">Initializing Sync Hub...</p>
        </div>
      </div>
    );
  }

  if (!currentUser && !isGuestMode) {
    return (
      <LoginView 
        onContinueAsGuest={() => setIsGuestMode(true)} 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsGuestMode(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800 antialiased selection:bg-slate-900 selection:text-white">
      
      {/* 1. TOP HEADER / APP NAVIGATION */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo branding */}
            <div className="flex items-center gap-2.5">
              {!logoFailed ? (
                <img
                  src="/Logo.jpg"
                  alt={profile.name}
                  className="h-9 w-auto object-contain rounded-lg"
                  onError={() => setLogoFailed(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-black flex items-center justify-center shadow-xs">
                  {profile.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-none">{profile.name}</h1>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Quotation & Invoice Hub</span>
              </div>
            </div>

            {/* Horizontal Tabs */}
            <nav className="hidden md:flex items-center space-x-1 bg-slate-100/50 p-1 rounded-xl border border-slate-50">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'documents', label: 'Documents', icon: FileText },
                { id: 'clients', label: 'Clients', icon: Users },
                { id: 'products', label: 'Catalog', icon: ShoppingBag },
                { id: 'settings', label: 'Business Profile', icon: Settings },
              ].map(tab => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`nav-tab-${tab.id}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'documents') {
                        setDocSubView('list');
                        setActiveDocId(null);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                      isSelected 
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-100' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Quick stats / Date clock & User Auth */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl font-medium">
                <Clock size={12} />
                <span>UTC: 2026-07-11</span>
              </div>

              {currentUser ? (
                <div className="flex items-center gap-2.5 border-l border-slate-100 pl-3">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-[10px] font-bold text-slate-900 leading-none">
                      {currentUser.displayName || 'Synced User'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono leading-none mt-1">
                      {currentUser.email}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-xl transition cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsGuestMode(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  <span>Sign In</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* 2. MOBILE BOTTOM / SIDE BAR NAVIGATION (Touch friendly) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 px-4 py-2 flex justify-around items-center z-40 no-print shadow-lg">
        {[
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'documents', label: 'Docs', icon: FileText },
          { id: 'clients', label: 'Clients', icon: Users },
          { id: 'products', label: 'Catalog', icon: ShoppingBag },
          { id: 'settings', label: 'Profile', icon: Settings },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'documents') {
                  setDocSubView('list');
                  setActiveDocId(null);
                }
              }}
              className={`flex flex-col items-center gap-1 p-1.5 transition cursor-pointer ${
                isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon size={18} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + '-' + docSubView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full"
          >
            
            {/* Dashboard tab */}
            {activeTab === 'dashboard' && (
              <DashboardHome
                documents={documents}
                clients={clients}
                currency={profile.currency}
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  if (tab === 'documents') {
                    setDocSubView('list');
                    setActiveDocId(null);
                  }
                }}
                onNewDoc={handleCreateFreshDoc}
                onViewDoc={(id) => {
                  setActiveDocId(id);
                  setDocSubView('view');
                  setActiveTab('documents');
                }}
              />
            )}

            {/* Documents tab (Quotations & Invoices) */}
            {activeTab === 'documents' && (
              <>
                {docSubView === 'list' && (
                  <DocumentsList
                    documents={documents}
                    clients={clients}
                    currency={profile.currency}
                    onNewDoc={handleCreateFreshDoc}
                    onViewDoc={(id) => {
                      setActiveDocId(id);
                      setDocSubView('view');
                    }}
                    onEditDoc={(id) => {
                      setActiveDocId(id);
                      setDocSubView('create-edit');
                    }}
                    onDeleteDoc={handleDeleteDocument}
                    onConvertQuotation={handleConvertQuotationToInvoice}
                  />
                )}

                {docSubView === 'create-edit' && (
                  <DocumentBuilder
                    documentToEdit={currentActiveDoc}
                    clients={clients}
                    products={products}
                    companyProfile={profile}
                    onSave={handleSaveDocument}
                    onCancel={() => {
                      // If it was a temp document we discarded or cancelled, delete it from state
                      if (activeDocId?.startsWith('doc-temp-client-fill')) {
                        setDocuments(prev => prev.filter(d => d.id !== activeDocId));
                      }
                      setDocSubView('list');
                      setActiveDocId(null);
                    }}
                    onAddClientInline={handleAddClient}
                    onAddProductInline={handleAddProduct}
                    documents={documents}
                  />
                )}

                {docSubView === 'view' && currentActiveDoc && docClient && (
                  <DocumentView
                    document={currentActiveDoc}
                    client={docClient}
                    onBack={() => setDocSubView('list')}
                    onEdit={() => setDocSubView('create-edit')}
                    onUpdateStatus={handleUpdateDocumentStatus}
                  />
                )}
              </>
            )}

            {/* Clients registry tab */}
            {activeTab === 'clients' && (
              <ClientsList
                clients={clients}
                documents={documents}
                onAddClient={handleAddClient}
                onUpdateClient={handleUpdateClient}
                onDeleteClient={handleDeleteClient}
                onCreateDocForClient={handleCreateDocForClient}
              />
            )}

            {/* Products catalog tab */}
            {activeTab === 'products' && (
              <ProductsList
                products={products}
                currency={profile.currency}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onBulkSyncProducts={handleBulkSyncProducts}
              />
            )}

            {/* Business Settings tab */}
            {activeTab === 'settings' && (
              <CompanySettings
                profile={profile}
                onSave={(newProfile) => {
                  setProfile(newProfile);
                  if (currentUser) {
                    saveCompanyProfileToCloud(currentUser.uid, newProfile);
                  }
                }}
              />
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Custom Deletion Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight">
                    {deleteConfirm.title}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                    {deleteConfirm.message}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
