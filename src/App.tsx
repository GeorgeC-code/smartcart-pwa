import { GoogleGenAI } from "@google/genai";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, 
  History, 
  Settings, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  AlertCircle,
  ArrowLeft,
  Shield,
  Minus,
  ChevronRight,
  TrendingUp,
  Wallet,
  Edit2,
  Download,
  Globe,
  Volume2,
  Layout,
  Languages,
  Delete,
  CloudOff,
  Zap,
  Crown,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CartItem, ShoppingSession } from './types';
import { cn } from './lib/utils';
import { translations, Language } from './translations';
import PrivacyPolicy from './components/PrivacyPolicy';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface NumericKeypadProps {
  value: string;
  onChange: (val: string) => void;
  onClose?: () => void;
  className?: string;
}

const NumericKeypad = ({ value, onChange, onClose, className }: NumericKeypadProps) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];
  
  const handleKeyClick = (key: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5);
    }
    if (key === 'backspace') {
      onChange(value.slice(0, -1));
    } else if (key === '.') {
      if (!value.includes('.')) {
        onChange(value + '.');
      }
    } else {
      if (value.includes('.')) {
        const [, decimal] = value.split('.');
        if (decimal && decimal.length >= 2) return;
      }
      if (value.length >= 8) return;
      onChange(value + key);
    }
  };

  return (
    <div 
      className={cn("space-y-2", className)}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100/50 rounded-2xl">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={() => handleKeyClick(key)}
          className={cn(
            "h-14 rounded-xl font-bold text-xl flex items-center justify-center transition-all active:scale-90 shadow-sm",
            key === 'backspace' ? "bg-slate-200 text-slate-600" : "bg-white text-slate-800"
          )}
        >
          {key === 'backspace' ? <Delete className="w-5 h-5" /> : key}
        </button>
      ))}
      </div>
    </div>
  );
};

interface NameKeypadProps {
  value: string;
  onChange: (val: string) => void;
  onClose?: () => void;
  className?: string;
  language?: Language;
}

const NameKeypad = ({ value, onChange, onClose, className, language }: NameKeypadProps) => {
  const enRows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'backspace'],
    ['space']
  ];

  const ruRows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З'],
    ['Х', 'Ъ', 'Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л'],
    ['Д', 'Ж', 'Э', 'Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь'],
    ['Б', 'Ю', '.', ',', 'backspace'],
    ['space']
  ];

  const rows = language === 'ru' ? ruRows : enRows;

  const handleKeyClick = (key: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5);
    }
    if (key === 'backspace') {
      onChange(value.slice(0, -1));
    } else if (key === 'space') {
      onChange(value + ' ');
    } else if (key === 'Done') {
      if (onClose) onClose();
      else (document.activeElement as HTMLElement)?.blur();
    } else {
      if (value.length >= 30) return;
      onChange(value + key);
    }
  };

  return (
    <div 
      className={cn("space-y-2", className)}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="bg-slate-100/50 p-2 rounded-3xl space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-center gap-1">
            {row.map((key) => (
              <button
                key={key}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onClick={() => handleKeyClick(key)}
                className={cn(
                  "h-11 rounded-lg font-black text-sm flex items-center justify-center transition-all active:scale-90 shadow-sm bg-white text-slate-800",
                  key === 'backspace' ? "w-14 bg-slate-200 text-slate-600" : 
                  key === 'space' ? "w-full" : "w-10"
                )}
              >
                {key === 'backspace' ? <Delete className="w-4 h-4" /> : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const Logo = ({ className }: { className?: string }) => (
  <div className={cn("w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200", className)}>
    <ShoppingCart className="w-6 h-6 text-white" />
  </div>
);

// Removed CameraScanner components and props

const AdBanner = ({ isPremium, onUpgrade }: { isPremium: boolean; onUpgrade: () => void }) => {
  if (isPremium) return null;
  const ads = [
    { title: "Remove all ads", desc: "Get SmartCart Plus for just $1.99 and enjoy an ad-free experience forever.", icon: <Zap className="w-6 h-6 text-indigo-500" /> },
    { title: "Upgrade to Ad-free Smart Plus", desc: "Enjoy a premium, clean, and completely ad-free SmartCart experience.", icon: <Crown className="w-6 h-6 text-amber-500" /> },
    { title: "Unlock Pure Focus", desc: "Minimalist, clean, and distraction-free shopping. Go Plus today.", icon: <Shield className="w-6 h-6 text-blue-500" /> }
  ];
  
  const [adIndex] = useState(() => Math.floor(Math.random() * ads.length));
  const ad = ads[adIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 mb-2 p-5 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 border border-slate-100 rounded-[2rem] relative overflow-hidden shadow-sm group"
    >
      <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-100 text-[8px] font-extrabold text-indigo-500 rounded-bl-2xl uppercase tracking-[0.2em] group-hover:bg-indigo-600 group-hover:text-white transition-colors">
        Sponsored
      </div>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-indigo-50">
           {ad.icon}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-800 leading-tight">{ad.title}</h4>
          <p className="text-[10px] text-slate-500 font-medium mt-1">{ad.desc}</p>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onUpgrade();
          }}
          className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-xl shadow-lg shadow-indigo-100 active:scale-95 transition-all whitespace-nowrap"
        >
          Upgrade
        </button>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'add' | 'cart' | 'stats' | 'settings'>('add');
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem('cart_is_premium') === 'true';
  });
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('cart_language');
    const validLangs: Language[] = ['en', 'de', 'es', 'ru'];
    if (saved && validLangs.includes(saved as Language)) {
      return saved as Language;
    }
    return 'en';
  });
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showKeySelection, setShowKeySelection] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUpgrade = () => {
    setIsPremium(true);
    localStorage.setItem('cart_is_premium', 'true');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
  };

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setShowKeySelection(!hasKey);
      }
    };
    checkKey();
  }, [activeTab]);

  const t = translations[language];

  const openKeySelection = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setShowKeySelection(false);
    }
  };

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [pendingItem, setPendingItem] = useState<{ name: string; price: number } | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState(1);
  const [budget, setBudget] = useState<number>(() => {
    const saved = localStorage.getItem('cart_budget');
    return saved ? parseFloat(saved) : 100;
  });
  const [history, setHistory] = useState<ShoppingSession[]>(() => {
    const saved = localStorage.getItem('cart_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedHistorySession, setSelectedHistorySession] = useState<ShoppingSession | null>(null);

  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [storeName, setStoreName] = useState(() => {
    const saved = localStorage.getItem('cart_store_name');
    return saved || '';
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [showShopPopup, setShowShopPopup] = useState(false);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [manualPriceInput, setManualPriceInput] = useState('');
  const [manualNameInput, setManualNameInput] = useState('');
  const [productNamesHistory, setProductNamesHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('cart_product_names');
    if (saved) return JSON.parse(saved);
    
    // Seed from history if available
    const historySaved = localStorage.getItem('cart_history');
    if (historySaved) {
      try {
        const parsedHistory: ShoppingSession[] = JSON.parse(historySaved);
        const names = new Set<string>();
        parsedHistory.forEach(session => {
          session.items.forEach(item => {
            if (item.name && item.name !== 'Manual Entry' && item.name !== 'Ručni unos') {
              names.add(item.name);
            }
          });
        });
        return Array.from(names).slice(0, 50);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [budgetInput, setBudgetInput] = useState(budget.toString());
  const [statsSearch, setStatsSearch] = useState('');
  const [focusedField, setFocusedField] = useState<'name' | 'price' | 'budget' | 'storeName' | 'statsSearch' | null>(null);

  type SortField = 'name' | 'price' | 'quantity';
  type SortOrder = 'asc' | 'desc';
  const [sortBy, setSortBy] = useState<SortField>('price');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const sortedCart = React.useMemo(() => {
    return [...cart].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        comparison = (a.price * a.quantity) - (b.price * b.quantity);
      } else if (sortBy === 'quantity') {
        comparison = a.quantity - b.quantity;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [cart, sortBy, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const startEditing = (item: CartItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditPrice(item.price.toString());
    setEditQuantity(item.quantity);
  };

  const saveEdit = () => {
    if (!editingItem) return;
    const updatedCart = cart.map(item => 
      item.id === editingItem.id 
        ? { ...item, name: editName, price: parseFloat(editPrice) || 0, quantity: editQuantity } 
        : item
    );
    setCart(updatedCart);
    addToProductHistory(editName);
    setEditingItem(null);
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const budgetProgress = Math.min((total / budget) * 100, 100);
  const isOverBudget = total > budget;

  const searchResults = React.useMemo(() => {
    if (!statsSearch) return null;
    
    const query = statsSearch.toLowerCase();
    const monthlyData: { [key: string]: number } = {};
    
    history.forEach(session => {
      const date = new Date(session.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const sortKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      const shopName = (session.storeName || '').toLowerCase();
      if (shopName.includes(query)) {
        if (!monthlyData[sortKey]) {
          monthlyData[sortKey] = 0;
        }
        monthlyData[sortKey] += session.total;
      }
    });
    
    return Object.entries(monthlyData)
      .map(([sortKey, total]) => {
        const [year, month] = sortKey.split('-');
        const displayKey = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(language, { year: 'numeric', month: 'short' });
        return { displayKey, total, sortKey };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [history, statsSearch, language]);

  const monthlyStats = React.useMemo(() => {
    const monthlyData: { [key: string]: number } = {};
    
    history.forEach(session => {
      const date = new Date(session.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const sortKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      if (!monthlyData[sortKey]) {
        monthlyData[sortKey] = 0;
      }
      monthlyData[sortKey] += session.total;
    });
    
    return Object.entries(monthlyData)
      .map(([sortKey, total]) => {
        const [year, month] = sortKey.split('-');
        const displayKey = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(language, { year: 'numeric', month: 'short' });
        return { displayKey, total, sortKey };
      })
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [history, language]);

  useEffect(() => {
    localStorage.setItem('cart_budget', budget.toString());
    localStorage.setItem('cart_history', JSON.stringify(history));
    localStorage.setItem('cart_items', JSON.stringify(cart));
    localStorage.setItem('cart_product_names', JSON.stringify(productNamesHistory));
    localStorage.setItem('cart_language', language);
    localStorage.setItem('cart_store_name', storeName);
  }, [budget, history, cart, language, productNamesHistory, storeName]);

  const playSuccessSound = () => {
    console.log('Attempting to play success sound...');
    // Using a more reliable "pop" sound URL
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
    audio.volume = 0.7;
    audio.play().then(() => {
      console.log('Sound played successfully');
    }).catch(e => {
      console.warn('Primary audio play failed, trying fallback:', e);
      // Fallback to a different source if the first one fails
      const fallbackAudio = new Audio('https://www.soundjay.com/buttons/sounds/button-37a.mp3');
      fallbackAudio.volume = 0.5;
      fallbackAudio.play().then(() => {
        console.log('Fallback sound played successfully');
      }).catch(err => console.error('Fallback audio also failed:', err));
    });
  };

  const addToProductHistory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === t.scan.manualEntry) return;
    setProductNamesHistory(prev => {
      if (prev.includes(trimmed)) return prev;
      const next = [trimmed, ...prev].slice(0, 100); // Keep last 100
      return next;
    });
  };

  const handleManualSubmit = () => {
    const cleanPrice = parseFloat(manualPriceInput.replace(',', '.'));
    if (!isNaN(cleanPrice) && cleanPrice > 0) {
      setPendingItem({
        name: manualNameInput.trim() || t.scan.manualEntry,
        price: cleanPrice
      });
      setPendingQuantity(1);
      setShowProductPopup(false);
      setManualPriceInput('');
      setManualNameInput('');
      setFocusedField(null);
    }
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const checkout = () => {
    if (cart.length === 0) return;
    
    const session: ShoppingSession = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      total,
      items: [...cart],
      storeName: storeName.trim() || undefined
    };
    
    setHistory(prev => [session, ...prev]);
    setCart([]);
    setStoreName('');
    setActiveTab('stats');
    setCheckoutSuccess(true);
    setTimeout(() => setCheckoutSuccess(false), 3000);
  };

  const exportToCSV = () => {
    if (history.length === 0) return;
    
    let csv = 'Date,Store,Item,Price,Quantity,Total\n';
    history.forEach(session => {
      const date = new Date(session.date).toLocaleDateString();
      const store = session.storeName || 'N/A';
      session.items.forEach(item => {
        csv += `"${date}","${store}","${item.name}",${item.price},${item.quantity},${(item.price * item.quantity).toFixed(2)}\n`;
      });
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `shopping_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('cart_history');
    setShowClearConfirm(false);
  };

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 overflow-hidden shadow-xl">
      {/* Header */}
      <header className={cn(
        "px-4 bg-white border-b border-slate-100 transition-all duration-300",
        activeTab === 'add' ? "pt-4 pb-2" : "pt-3 pb-2"
      )}>
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-3">
            {activeTab === 'add' ? (
              <>
                <Logo />
                <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">SmartCart</h1>
              </>
            ) : (
              <button 
                onClick={() => setActiveTab('add')}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 hover:bg-indigo-100 transition-all active:scale-95 group"
              >
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <Home className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">{t.common.home}</span>
              </button>
            )}
            {activeTab === 'add' && (
              <button
                onClick={() => {
                  const langs: Language[] = ['en', 'de', 'es', 'ru'];
                  const nextIndex = (langs.indexOf(language) + 1) % langs.length;
                  const nextLang = langs[nextIndex];
                  setLanguage(nextLang);
                  localStorage.setItem('cart_language', nextLang);
                }}
                className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold uppercase text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
              >
                <Globe className="w-3 h-3 text-indigo-500" />
                <span>{language}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full shadow-sm">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">
              {budget.toFixed(0)}
            </span>
          </div>
        </div>
        
        {/* Budget Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t.cart.budget}</span>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                "text-lg font-display font-bold",
                isOverBudget ? "text-[#F596AA]" : "text-indigo-600"
              )}>
                {Math.round(budgetProgress)}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Used</span>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, budgetProgress)}%` }}
              className={cn(
                "h-full transition-colors duration-500",
                isOverBudget ? "bg-[#F596AA]" : "bg-indigo-500"
              )}
            />
          </div>
          <div className="flex justify-end">
            <div className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5",
              isOverBudget ? "bg-[#FEF4F4] text-[#F596AA] border border-[#F596AA]/20" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
            )}>
              <span className="opacity-70">{total.toFixed(2)}</span>
              <span className="opacity-30">/</span>
              <span>{budget.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'add' && (
            <motion.div 
              key="add"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col space-y-4"
            >
              <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.scan.productName}</label>
                    <div className="relative">
                       <input 
                        type="text"
                        readOnly
                        placeholder="e.g. Milk, Bread..."
                        value={manualNameInput}
                        onClick={() => {
                          if (cart.length === 0 && !storeName) {
                            setShowShopPopup(true);
                          } else {
                            setShowProductPopup(true);
                            setFocusedField('name');
                          }
                        }}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 cursor-pointer hover:bg-slate-100/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.scan.price}</label>
                    <div className="relative">
                      <input 
                        type="text"
                        readOnly
                        placeholder="0.00"
                        value={manualPriceInput}
                        onClick={() => {
                          if (cart.length === 0 && !storeName) {
                            setShowShopPopup(true);
                          } else {
                            setShowProductPopup(true);
                            setFocusedField('price');
                          }
                        }}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-display font-black text-2xl text-slate-700 cursor-pointer hover:bg-slate-100/50 transition-colors"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (cart.length === 0 && !storeName) {
                        setShowShopPopup(true);
                      } else {
                        setShowProductPopup(true);
                      }
                    }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <Plus className="w-6 h-6" />
                    <span>{t.scan.manualEntry}</span>
                  </button>
                </div>
              </div>
              {cart.length > 0 && (
                <button 
                  onClick={() => setActiveTab('cart')}
                  className="mt-auto w-full py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-bold active:scale-95 transition-all flex items-center justify-center gap-3 shadow-sm hover:border-indigo-200 hover:text-indigo-600"
                >
                  <ShoppingCart className="w-6 h-6 text-indigo-500" />
                  {t.cart.viewCart} ({cart.length})
                </button>
              )}
              <AdBanner isPremium={isPremium} onUpgrade={handleUpgrade} />
            </motion.div>
          )}

          {activeTab === 'cart' && (
            <motion.div 
              key="cart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <h2 className="text-xl font-display font-semibold">{t.cart.title}</h2>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{cart.length} items</span>
                </div>
                
                {cart.length > 0 && (
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    {(['price', 'quantity', 'name'] as SortField[]).map((field) => (
                      <button
                        key={field}
                        onClick={() => toggleSort(field)}
                        className={cn(
                          "px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1",
                          sortBy === field ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        {field === 'name' && t.cart.sortName}
                        {field === 'price' && t.cart.sortPrice}
                        {field === 'quantity' && t.cart.sortQuantity}
                        {sortBy === field && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                          >
                            <TrendingUp className={cn("w-2.5 h-2.5 transition-transform", sortOrder === 'desc' && "rotate-180")} />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <p className="text-slate-500">{t.cart.empty}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedCart.map((item) => (
                    <motion.div 
                      layout
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center group"
                    >
                      <div className="space-y-1">
                        <h3 className="font-medium text-slate-900">{item.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.quantity % 1 === 0 ? `x${item.quantity}` : `${item.quantity} ${t.cart.weight}`}
                          </span>
                          <p className="text-sm text-indigo-600 font-semibold">
                            {(item.price * item.quantity).toFixed(2)}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            ({item.price.toFixed(2)} each)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => startEditing(item)}
                          className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-slate-400 hover:text-[#BB94D7] transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">{t.cart.storeName}</label>
                    <input 
                      type="text"
                      inputMode="none"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      placeholder={t.cart.storePlaceholder}
                      value={storeName}
                      onFocus={() => setFocusedField('storeName')}
                      onClick={() => setFocusedField('storeName')}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="p-6 bg-[#839b97] rounded-[2rem] flex justify-between items-center shadow-xl shadow-[#839b97]/20">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-white/80 uppercase tracking-wider">{t.cart.total}</span>
                      <p className="text-3xl font-display font-bold text-white">
                        {total.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                      <Wallet className="w-6 h-6" />
                    </div>
                  </div>
                  <button 
                    onClick={checkout}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-100 active:scale-95 transition-transform flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {t.cart.checkout}
                  </button>

                  <button 
                    onClick={() => setActiveTab('add')}
                    className="w-full py-4 border border-slate-200 text-slate-600 rounded-2xl font-semibold active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-slate-50 mt-3"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    {t.cart.returnToShopping}
                  </button>

                  <div className="mt-4">
                    {focusedField === 'storeName' && (
                      <NameKeypad 
                        value={storeName}
                        onChange={setStoreName}
                        onClose={() => setFocusedField(null)}
                        language={language}
                      />
                    )}
                  </div>
                  <AdBanner isPremium={isPremium} onUpgrade={handleUpgrade} />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <h2 className="text-xl font-display font-semibold">{t.stats.title}</h2>
                  <p className="text-sm text-slate-500">{t.stats.subtitle}</p>
                </div>
                {history.length > 0 && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setStatsSearch('')}
                      className={cn(
                        "p-3 bg-white border border-slate-100 rounded-2xl shadow-sm active:scale-90 transition-transform flex items-center justify-center",
                        statsSearch ? "text-indigo-600" : "text-slate-300"
                      )}
                    >
                      <Plus className={cn("w-4 h-4 transition-transform", statsSearch && "rotate-45")} />
                    </button>
                    <button 
                      onClick={exportToCSV}
                      className="p-3 bg-white border border-slate-100 rounded-2xl text-indigo-600 shadow-sm active:scale-90 transition-transform flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                    >
                      <Download className="w-4 h-4" />
                      {t.cart.export}
                    </button>
                  </div>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <p className="text-slate-500">{t.stats.empty}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Unified Search & Monthly Dashboard */}
                  <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-4">
                    <div className="space-y-3">                      {/* Search Bar Embedded */}
                      <div className="relative">
                        <input 
                          type="text"
                          inputMode="none"
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck="false"
                          placeholder={t.stats.searchShop}
                          value={statsSearch}
                          onFocus={() => setFocusedField('statsSearch')}
                          onClick={() => setFocusedField('statsSearch')}
                          onChange={(e) => setStatsSearch(e.target.value)}
                          className="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm"
                        />
                        {statsSearch && (
                          <button 
                            onClick={() => setStatsSearch('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {focusedField === 'statsSearch' && (
                        <NameKeypad 
                          value={statsSearch}
                          onChange={setStatsSearch}
                          onClose={() => setFocusedField(null)}
                          language={language}
                        />
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 px-1">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        {statsSearch ? (
                          <>{t.stats.monthlySpending}: <span className="text-indigo-600">"{statsSearch}"</span></>
                        ) : (
                          t.stats.monthlySpending
                        )}
                      </h3>

                      <div className="space-y-1">
                        {(statsSearch ? (searchResults?.slice().reverse() || []) : monthlyStats).slice(0, 12).map((res, i) => (
                          <div key={i} className="flex justify-between items-center px-4 py-2 hover:bg-slate-50 transition-colors rounded-xl">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{res.displayKey}</span>
                            <span className="text-base font-bold text-slate-900 font-display tracking-tight">{res.total.toFixed(2)}</span>
                          </div>
                        ))}
                        {statsSearch && (!searchResults || searchResults.length === 0) && (
                           <div className="py-2 text-center">
                              <p className="text-xs text-slate-400 font-medium">{t.stats.noResults}</p>
                           </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <AdBanner isPremium={isPremium} onUpgrade={handleUpgrade} />

                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t.stats.recent}</h3>
                      <button 
                        onClick={() => setShowClearConfirm(true)}
                        className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                      >
                        {t.stats.clearHistory}
                      </button>
                    </div>
                    
                    <div className="space-y-3 pb-4">
                      {history.slice(0, 15).map((session) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={session.id} 
                          onClick={() => setSelectedHistorySession(session)}
                          className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center active:scale-[0.98] transition-all cursor-pointer hover:border-indigo-100"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">
                                {new Date(session.date).toLocaleDateString(language, { month: 'short', day: 'numeric' })}
                              </p>
                              {session.storeName && (
                                <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">
                                  {session.storeName}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {session.items?.length || 0} {(session.items?.length || 0) === 1 ? t.cart.item : t.cart.items}
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-2">
                             <p className="font-display font-bold text-slate-900">
                                {session.total.toFixed(2)}
                             </p>
                             <ChevronRight className="w-4 h-4 text-slate-300" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}


          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-6">
                {/* Budget Setting */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">{t.settings.budget}</label>
                  <div className="relative">
                    <input 
                      type="text"
                      inputMode="none"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      value={budgetInput}
                      onFocus={() => setFocusedField('budget')}
                      onClick={() => setFocusedField('budget')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBudgetInput(val);
                        const parsed = parseFloat(val);
                        if (!isNaN(parsed)) setBudget(parsed);
                        else if (val === '') setBudget(0);
                      }}
                      placeholder="0"
                      className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-bold text-lg"
                    />
                  </div>
                  
                  <div className="mt-4">
                    {focusedField === 'budget' && (
                      <NumericKeypad 
                        value={budgetInput}
                        onChange={(val) => {
                          setBudgetInput(val);
                          const parsed = parseFloat(val);
                          if (!isNaN(parsed)) setBudget(parsed);
                          else if (val === '') setBudget(0);
                        }}
                        onClose={() => setFocusedField(null)}
                      />
                    )}
                  </div>
                </div>

                {/* Sound Test */}
                <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700">{t.settings.sound}</p>
                    <p className="text-[10px] text-slate-500">{t.settings.soundSub}</p>
                  </div>
                  <button 
                    onClick={playSuccessSound}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Premium Upgrade */}
                <div className="pt-2">
                  <div className={cn(
                    "relative overflow-hidden p-6 rounded-[2.5rem] transition-all",
                    isPremium 
                      ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl shadow-indigo-200" 
                      : "bg-white border border-slate-200"
                  )}>
                    {isPremium && (
                      <div className="absolute -top-4 -right-4 opacity-10">
                        <Crown className="w-32 h-32" />
                      </div>
                    )}
                    
                    <div className="relative flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Crown className={cn("w-5 h-5", isPremium ? "text-amber-300" : "text-indigo-600")} />
                          <h3 className="font-display font-black text-lg">
                            {isPremium ? t.settings.premiumMember : t.settings.premiumTitle}
                          </h3>
                        </div>
                        <p className={cn("text-xs font-medium", isPremium ? "text-indigo-100" : "text-slate-500")}>
                          {isPremium 
                            ? t.settings.adFree 
                            : t.settings.upgradeLabel}
                        </p>
                      </div>
                      {!isPremium && (
                        <button 
                          onClick={handleUpgrade}
                          className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                        >
                          {t.settings.upgrade}
                        </button>
                      )}
                    </div>

                    {!isPremium && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <Check className="w-3 h-3 text-indigo-500" />
                          {t.settings.noAds}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <Check className="w-3 h-3 text-indigo-500" />
                          {t.settings.supportDev}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Offline Status */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-700">{t.settings.storage}</p>
                      <p className="text-[10px] text-slate-500">{t.settings.storageSub}</p>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
                      isOnline ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {isOnline ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {t.settings.online}
                        </>
                      ) : (
                        <>
                          <CloudOff className="w-3 h-3" />
                          {t.settings.offlineMode}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-indigo-50/50 rounded-xl">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    <p className="text-[10px] text-indigo-700 font-medium">{t.settings.offlineEnabled}</p>
                  </div>
                </div>

                {/* Privacy & Policies */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <button 
                    onClick={() => setShowPrivacy(true)}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Shield className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-slate-700">{t.settings.privacyLetter}</p>
                        <p className="text-[10px] text-slate-500">{t.settings.privacySub}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => {
                      if (confirm("Clear all history?")) {
                        setHistory([]);
                        localStorage.removeItem('cart_history');
                      }
                    }}
                    className="w-full py-4 text-[#BB94D7] font-medium flex items-center justify-center gap-2 hover:bg-[#BB94D7]/10 rounded-2xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    Clear History
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      {!showShopPopup && !showProductPopup && !pendingItem && !editingItem && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100 px-3 py-1 pb-safe flex justify-between items-center z-[100] shadow-2xl">
          <NavButton 
            active={activeTab === 'add'} 
            onClick={() => setActiveTab('add')} 
            icon={<Plus className="w-6 h-6" />} 
            label={t.nav.scan}
          />
          <NavButton 
            active={activeTab === 'cart'} 
            onClick={() => setActiveTab('cart')} 
            icon={<ShoppingCart className="w-6 h-6" />} 
            label={t.nav.cart}
            badge={cart.length > 0 ? cart.length : undefined}
          />
          <NavButton 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')} 
            icon={<TrendingUp className="w-6 h-6" />} 
            label={t.nav.stats}
          />
          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<Settings className="w-6 h-6" />} 
            label="Settings"
          />
        </nav>
      )}

      {/* Privacy Policy Modal overlay */}
      <AnimatePresence>
        {showPrivacy && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrivacy(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-sm">
              <PrivacyPolicy 
                language={language} 
                onClose={() => setShowPrivacy(false)} 
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Shop Name Popup */}
      <AnimatePresence>
        {showShopPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-2 text-indigo-600">
                  <Logo className="w-10 h-10 shadow-none" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900">{t.shopPopup?.title || 'New Shopping Trip'}</h3>
                <p className="text-sm text-slate-500">{t.shopPopup?.instruction || 'Enter the shop name'}</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="text"
                    inputMode="none"
                    autoFocus
                    placeholder={t.cart.storePlaceholder}
                    value={storeName}
                    onFocus={() => setFocusedField('storeName')}
                    onClick={() => setFocusedField('storeName')}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  />
                  {focusedField === 'storeName' && (
                    <div className="mt-4">
                      <NameKeypad 
                        value={storeName}
                        onChange={setStoreName}
                        onClose={() => {
                          setFocusedField(null);
                          setShowShopPopup(false);
                          // After closing shop popup, focus the product name field
                          setTimeout(() => setFocusedField('name'), 100);
                        }}
                        language={language}
                      />
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => {
                    setShowShopPopup(false);
                    setShowProductPopup(true);
                  }}
                  disabled={!storeName.trim()}
                  className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 disabled:opacity-50 active:scale-95 transition-all"
                >
                  {t.common.save}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Entry Popup */}
      <AnimatePresence>
        {showProductPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-sm rounded-t-[3rem] sm:rounded-[3rem] p-6 space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setShowProductPopup(false);
                  setFocusedField(null);
                }}
                className="absolute right-6 top-6 p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="text-2xl font-display font-black text-slate-900">{t.scan.title}</h3>
                <p className="text-sm font-medium text-slate-500">{t.scan.subtitle}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.scan.productName}</label>
                  <div className="relative">
                    <input 
                      type="text"
                      inputMode="none"
                      placeholder="e.g. Organic Milk..."
                      value={manualNameInput}
                      autoFocus
                      onFocus={() => setFocusedField('name')}
                      onClick={() => setFocusedField('name')}
                      onChange={(e) => setManualNameInput(e.target.value)}
                      className={cn(
                        "w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold transition-all",
                        focusedField === 'name' ? "bg-white ring-2 ring-indigo-500/10" : ""
                      )}
                    />
                    
                    <AnimatePresence>
                      {focusedField === 'name' && manualNameInput.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 flex flex-wrap gap-2 overflow-hidden"
                        >
                          {productNamesHistory
                            .filter(name => name.toLowerCase().startsWith(manualNameInput.toLowerCase()))
                            .slice(0, 4)
                            .map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setManualNameInput(suggestion);
                                  setFocusedField('price');
                                }}
                                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100/50"
                              >
                                {suggestion}
                              </button>
                            ))
                          }
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.scan.price}</label>
                  <input 
                    type="text"
                    readOnly
                    inputMode="none"
                    placeholder="0.00"
                    value={manualPriceInput}
                    onFocus={() => setFocusedField('price')}
                    onClick={() => setFocusedField('price')}
                    className={cn(
                      "w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-display font-black text-2xl transition-all",
                      focusedField === 'price' ? "bg-white ring-2 ring-indigo-500/10" : ""
                    )}
                  />
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleManualSubmit}
                    disabled={!manualPriceInput || parseFloat(manualPriceInput.replace(',', '.')) <= 0}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 disabled:opacity-30 disabled:scale-100 active:scale-95 transition-all"
                  >
                    Done
                  </button>
                </div>

                <div className="min-h-[220px]">
                  <AnimatePresence mode="wait">
                    {focusedField === 'name' && (
                      <motion.div
                        key="name-keypad"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <NameKeypad 
                          value={manualNameInput}
                          onChange={setManualNameInput}
                          onClose={() => setFocusedField('price')}
                          language={language}
                        />
                      </motion.div>
                    )}
                    {focusedField === 'price' && (
                      <motion.div
                        key="price-keypad"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <NumericKeypad 
                          value={manualPriceInput}
                          onChange={setManualPriceInput}
                          onClose={() => setFocusedField(null)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Session Details Modal */}
      <AnimatePresence>
        {selectedHistorySession && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden flex flex-col max-h-[85vh] shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 pb-4 border-b border-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1">
                    <h3 className="text-xl font-display font-bold text-slate-900">
                      {selectedHistorySession.storeName || t.stats.recent}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(selectedHistorySession.date).toLocaleDateString(language, { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedHistorySession(null)}
                    className="p-2.5 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {selectedHistorySession.items?.map((item, idx) => (
                  <div key={item.id || idx} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-800">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {item.quantity} {item.quantity === 1 ? t.cart.unit : 'pcs'} × {item.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-display font-bold text-slate-900">
                      {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-6 pt-4 bg-slate-50 border-t border-slate-100">
                <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-200/50">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Amount</p>
                  <p className="text-2xl font-display font-bold text-indigo-600">
                    {selectedHistorySession.total.toFixed(2)}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div 
            key="edit-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              key="edit-modal-content"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-sm rounded-2xl p-4 space-y-3 shadow-2xl"
            >
              <div className="flex justify-between items-center px-2">
                <h3 className="text-xl font-display font-bold">{t.common.editItem}</h3>
                <button onClick={() => setEditingItem(null)} className="p-2 text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">{t.scan.productName}</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  {editName.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {productNamesHistory
                          .filter(name => name.toLowerCase().startsWith(editName.toLowerCase()))
                          .slice(0, 3)
                          .map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => setEditName(suggestion)}
                              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100 active:scale-95 transition-all"
                            >
                              {suggestion}
                            </button>
                          ))
                        }
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{t.scan.price}</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editPrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^0+(?=\d)/, '');
                      setEditPrice(val);
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{t.cart.quantity}</label>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setEditQuantity(prev => Math.max(0.1, prev - 1))}
                      className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 active:scale-90 transition-transform"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 relative">
                      <input 
                        type="number"
                        step="0.01"
                        value={editQuantity}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setEditQuantity(val);
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-center text-xl"
                      />
                    </div>
                    <button 
                      onClick={() => setEditQuantity(prev => prev + 1)}
                      className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button 
                  onClick={saveEdit}
                  disabled={editQuantity <= 0}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  {t.common.saveChanges}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quantity Selection Modal (for new items) */}
      <AnimatePresence>
        {pendingItem && (
          <motion.div 
            key="pending-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              key="pending-modal-content"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-sm rounded-2xl p-4 space-y-4 shadow-2xl"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 mb-2">
                  <Plus className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-display font-bold">{pendingItem.name}</h3>
                <p className="text-slate-500 font-medium">
                  {pendingItem.price.toFixed(2)} {t.common.each}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center block">{t.cart.quantity}</label>
                  <div className="flex items-center justify-center gap-6">
                    <button 
                      onClick={() => setPendingQuantity(prev => Math.max(0.1, prev - 1))}
                      className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 active:scale-90 transition-transform"
                    >
                      <Minus className="w-6 h-6" />
                    </button>
                    <div className="w-24">
                      <input 
                        type="number"
                        step="0.01"
                        value={pendingQuantity}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setPendingQuantity(val);
                        }}
                        className="w-full bg-transparent text-4xl font-display font-bold text-slate-900 text-center outline-none focus:ring-0"
                      />
                    </div>
                    <button 
                      onClick={() => setPendingQuantity(prev => prev + 1)}
                      className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 active:scale-90 transition-transform"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">{t.cart.total}</span>
                  <span className="text-xl font-bold text-indigo-600">
                    {(pendingItem.price * pendingQuantity).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setPendingItem(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button 
                  onClick={() => {
                    if (pendingQuantity <= 0) return;
                    const newItem: CartItem = {
                      id: Math.random().toString(36).substr(2, 9),
                      name: pendingItem.name,
                      price: pendingItem.price,
                      quantity: pendingQuantity,
                      timestamp: Date.now()
                    };
                    setCart(prev => [...prev, newItem]);
                    addToProductHistory(newItem.name);
                    playSuccessSound();
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                      navigator.vibrate(10);
                    }
                    setPendingItem(null);
                    // If we were in add tab, let's make sure we are on add tab
                    setActiveTab('add');
                  }}
                  disabled={pendingQuantity <= 0}
                  className="flex-2 py-4 bg-[#839b97] text-white rounded-2xl font-semibold shadow-lg shadow-[#839b97]/20 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
                >
                  {t.scan.addToCart}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Success */}
        <AnimatePresence>
          {checkoutSuccess && (
            <motion.div
              key="checkout-success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white px-8 py-6 rounded-[2rem] font-bold shadow-2xl z-[80] flex flex-col items-center gap-4 text-center min-w-[280px]"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8" strokeWidth={3} />
              </div>
              <div>
                <p className="text-xl">{t.cart.checkoutSuccess}</p>
                <p className="text-sm font-normal opacity-80 mt-1">{t.cart.checkoutSuccessSub}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clear History Confirmation */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div 
              key="clear-history-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            >
              <motion.div 
                key="clear-history-content"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-xs rounded-2xl p-4 space-y-4 shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-[#FEF4F4] rounded-full flex items-center justify-center mx-auto text-[#F596AA]">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">Clear History?</h3>
                  <p className="text-sm text-slate-500">{t.cart.confirmClear}</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold"
                  >
                    {t.common.cancel}
                  </button>
                  <button 
                    onClick={clearHistory}
                    className="flex-1 py-3 bg-[#BB94D7] text-white rounded-xl font-semibold shadow-lg shadow-[#BB94D7]/20"
                  >
                    {t.common.delete}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, badge }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  badge?: number;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 transition-all relative",
        active ? "text-indigo-600" : "text-slate-400"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-xl transition-all",
        active ? "bg-indigo-50" : "bg-transparent"
      )}>
        {icon}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#BB94D7] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
          {badge}
        </span>
      )}
    </button>
  );
}
