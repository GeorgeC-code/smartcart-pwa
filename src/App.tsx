import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Volume2, 
  Settings as SettingsIcon, 
  Check, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Download, 
  Search, 
  ShieldAlert, 
  Languages, 
  Globe,
  Sparkles, 
  Heart, 
  X, 
  RefreshCw,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  Store,
  DollarSign,
  Calendar,
  Layers,
  AlertTriangle,
  Pencil,
  Wallet,
  Coins,
  ChevronRight,
  Shield,
  HelpCircle,
  Home,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from './translations';
import { CartItem, ShoppingTrip, Settings, Language } from './types';
import PrivacyPolicy from './components/PrivacyPolicy';

function getRussianGoodsWord(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) {
    return 'ТОВАРОВ';
  }
  if (mod10 === 1) {
    return 'ТОВАР';
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return 'ТОВАРА';
  }
  return 'ТОВАРОВ';
}

export default function App() {
  // --- Persistent State Loaders ---
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('smartcart_language') as Language) || 'en';
  });

  const [activeTab, setActiveTab] = useState<'scan' | 'cart' | 'stats' | 'settings'>(() => {
    return (localStorage.getItem('smartcart_active_tab') as 'scan' | 'cart' | 'stats' | 'settings') || 'scan';
  });

  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('smartcart_cart_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [trips, setTrips] = useState<ShoppingTrip[]>(() => {
    const saved = localStorage.getItem('smartcart_trips');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('smartcart_settings');
    if (saved) return JSON.parse(saved);
    return {
      budget: 100.00,
      soundEnabled: true,
      isPremium: false,
      language: 'en'
    };
  });

  const [storeName, setStoreName] = useState<string>(() => {
    return localStorage.getItem('smartcart_store_name') || '';
  });

  // --- UI Interactive States ---
  const [formData, setFormData] = useState({
    name: '',
    price: ''
  });

  const [isAdding, setIsAdding] = useState(false);
  const [addStatus, setAddStatus] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'quantity'>('name');

  // Modal and custom sheet controls
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isStorePopupOpen, setIsStorePopupOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<ShoppingTrip | null>(null);
  
  // Custom states
  const [activationCode, setActivationCode] = useState('');
  const [activationError, setActivationError] = useState('');
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [storeInput, setStoreInput] = useState('');

  // States for custom quantity popup workflow
  const [pendingItemToAdd, setPendingItemToAdd] = useState<{ name: string; price: number } | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState<number>(1);
  const [pendingUnit, setPendingUnit] = useState<'each' | 'kg'>('each');
  const [quantityInputStr, setQuantityInputStr] = useState<string>('1');
  const [isQuantityModified, setIsQuantityModified] = useState<boolean>(false);

  // States for virtual keypad
  const [activeInput, setActiveInput] = useState<{
    id: string;
    label: string;
    type: 'text' | 'numeric';
    value: string;
    setValue: (val: string) => void;
  } | null>(null);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [currentKeyboardLang, setCurrentKeyboardLang] = useState<'latin' | 'cyrillic'>('latin');

  // Form input ref for re-focusing
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('smartcart_language', language);
    setSettings(prev => ({ ...prev, language }));
  }, [language]);

  useEffect(() => {
    localStorage.setItem('smartcart_cart_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('smartcart_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('smartcart_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('smartcart_store_name', storeName);
  }, [storeName]);

  useEffect(() => {
    localStorage.setItem('smartcart_active_tab', activeTab);
  }, [activeTab]);

  const t = translations[language] || translations.en;

  // --- SOUND FEEDBACK SYNTH ---
  const playScannerBeep = () => {
    if (!settings.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1900, audioCtx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio context playback failed or blocked:', e);
    }
  };

  const playSuccessChime = () => {
    if (!settings.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playChimeNote = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.01);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      
      const now = audioCtx.currentTime;
      playChimeNote(880, now, 0.1); 
      playChimeNote(1046.5, now + 0.08, 0.1); 
      playChimeNote(1318.5, now + 0.16, 0.25); 
    } catch (e) {
      console.warn('Audio context success chime blocked:', e);
    }
  };

  // --- HAPTIC VIBRATION FEEDBACK ---
  const triggerHaptic = (duration: number = 30) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch (e) {
        // Sandboxed/iframe safe fail-safe
      }
    }
  };

  // --- FORM HANDLERS (ADD ITEM) ---
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    const priceVal = parseFloat(formData.price) || 0.00;

    // Dismiss active virtual keyboard
    setActiveInput(null);

    // Set pending details to open Quantity selection popup
    setPendingItemToAdd({
      name: formData.name.trim(),
      price: priceVal
    });
    setPendingQuantity(1);
    setQuantityInputStr('1');
    setIsQuantityModified(false);
    setPendingUnit('each');
    triggerHaptic(30);
  };

  const confirmPendingItemAdd = () => {
    if (!pendingItemToAdd) return;

    setIsAdding(true);
    setAddStatus('scanning');
    playScannerBeep();
    triggerHaptic(40);

    // Clear active virtual keyboard
    setActiveInput(null);

    setTimeout(() => {
      setAddStatus('success');
      
      const parsedQuantity = parseFloat(quantityInputStr) || 1;
      const newItem: CartItem = {
        id: `it-${Date.now()}`,
        name: pendingItemToAdd.name,
        price: pendingItemToAdd.price,
        quantity: parsedQuantity,
        unit: pendingUnit,
        completed: true 
      };

      setItems(prev => [newItem, ...prev]);

      if (!storeName) {
        setStoreInput('');
        setIsStorePopupOpen(true);
      }

      setTimeout(() => {
        setAddStatus('idle');
        setIsAdding(false);
        setFormData({
          name: '',
          price: ''
        });
        setPendingItemToAdd(null);
        setActiveTab('cart');
      }, 700);

    }, 450);
  };

  // --- VIRTUAL KEYBOARD HELPERS ---
  const registerActiveInput = (
    id: string,
    label: string,
    type: 'text' | 'numeric',
    currentValue: string,
    setValueFn: (val: string) => void
  ) => {
    if (['itemName', 'editItemName', 'storeName', 'storeNameCart', 'storePopup'].includes(id)) {
      setCurrentKeyboardLang('latin');
    }
    setActiveInput({
      id,
      label,
      type,
      value: currentValue,
      setValue: setValueFn
    });
  };

  const handleProductFieldFocus = (fieldType: 'name' | 'price') => {
    if (!storeName.trim()) {
      registerActiveInput(
        'storeName',
        language === 'ru' ? 'МАГАЗИН (НАЗВАНИЕ)' : 'STORE NAME',
        'text',
        storeName,
        setStoreName
      );
    } else {
      if (fieldType === 'name') {
        registerActiveInput(
          'itemName',
          t.scan.productName,
          'text',
          formData.name,
          (val) => setFormData(prev => ({ ...prev, name: val }))
        );
      } else {
        registerActiveInput(
          'itemPrice',
          t.scan.price,
          'numeric',
          formData.price,
          (val) => setFormData(prev => ({ ...prev, price: val }))
        );
      }
    }
  };

  const handleKeyboardOkSubmit = () => {
    if (!activeInput) return;
    const currentId = activeInput.id;
    setActiveInput(null);
    triggerHaptic(10);

    if (currentId === 'storeName') {
      setTimeout(() => {
        registerActiveInput(
          'itemName',
          t.scan.productName,
          'text',
          formData.name,
          (val) => setFormData(prev => ({ ...prev, name: val }))
        );
      }, 150);
    } else if (currentId === 'itemName') {
      setTimeout(() => {
        registerActiveInput(
          'itemPrice',
          t.scan.price,
          'numeric',
          formData.price,
          (val) => setFormData(prev => ({ ...prev, price: val }))
        );
      }, 150);
    } else if (currentId === 'itemPrice') {
      setTimeout(() => {
        const priceVal = parseFloat(formData.price) || 0.00;
        setPendingItemToAdd({
          name: formData.name.trim(),
          price: priceVal
        });
        setPendingQuantity(1);
        setQuantityInputStr('1');
        setIsQuantityModified(false);
        setPendingUnit('each');
        triggerHaptic(30);
      }, 150);
    }
  };

  const handleKeyPress = (val: string) => {
    if (!activeInput) return;
    triggerHaptic(10);

    let newVal = activeInput.value;

    if (val === '⌫') {
      newVal = newVal.slice(0, -1);
    } else if (val === 'Space') {
      newVal = newVal + ' ';
    } else {
      newVal = newVal + val;
    }

    activeInput.setValue(newVal);
    setActiveInput(prev => prev ? { ...prev, value: newVal } : null);
  };

  // --- CART MANAGEMENT ---
  const toggleItemCompleted = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
    triggerHaptic(15);
  };

  const updateItemQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const step = item.unit === 'kg' ? 0.1 : 1;
        const newQty = Math.max(step, item.quantity + (delta * step));
        return { ...item, quantity: Math.round(newQty * 100) / 100 };
      }
      return item;
    }));
    triggerHaptic(10);
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    triggerHaptic(25);
  };

  const clearCurrentCart = () => {
    setItems([]);
    setStoreName('');
  };

  // Calculations
  const currentCartTotal = items.reduce((sum, item) => sum + (item.completed ? (item.price * item.quantity) : 0), 0);
  const formattedCartTotal = Math.round(currentCartTotal * 100) / 100;
  const isOverBudget = formattedCartTotal > settings.budget;
  const budgetPercentage = Math.min(100, settings.budget > 0 ? (formattedCartTotal / settings.budget) * 100 : 0);

  // Sorting based on Segment Controls (Screenshot 5)
  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'price') return b.price - a.price;
    if (sortBy === 'quantity') return b.quantity - a.quantity;
    return 0;
  });

  // --- CHECKOUT ACTIONS ---
  const handleCheckoutTrip = () => {
    if (items.length === 0) return;

    // Premium limits check: Block at 5+ trips of trial
    if (!settings.isPremium && trips.length >= 5) {
      setIsPremiumModalOpen(true);
      return;
    }

    playSuccessChime();
    triggerHaptic(100);

    const newTrip: ShoppingTrip = {
      id: `tr-${Date.now()}`,
      date: new Date().toISOString(),
      storeName: storeName.trim() || 'Lidl',
      items: [...items],
      total: formattedCartTotal,
      budgetAtTrip: settings.budget
    };

    setTrips(prev => [newTrip, ...prev]);
    setActiveTab('stats');
    setItems([]);
    setStoreName('');
  };

  // --- STATS TAB LOGIC ---
  const filteredTrips = trips.filter(trip => 
    trip.storeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statsTotalSpent = trips.reduce((sum, trip) => sum + trip.total, 0);
  const statsAverageSpent = trips.length > 0 ? statsTotalSpent / trips.length : 0;

  const monthlyAverage = (() => {
    if (trips.length === 0) return 0;
    const monthsMap: Record<string, number> = {};
    trips.forEach(trip => {
      const d = new Date(trip.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthsMap[key] = (monthsMap[key] || 0) + trip.total;
    });
    const monthSums = Object.values(monthsMap);
    if (monthSums.length === 0) return 0;
    const totalSum = monthSums.reduce((acc, val) => acc + val, 0);
    return totalSum / monthSums.length;
  })();
  const statsTotalItemsBought = trips.reduce((sum, trip) => 
    sum + trip.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  const clearAllHistory = () => {
    setTrips([]);
    setIsConfirmClearOpen(false);
    triggerHaptic(50);
  };

  // Monthly aggregated chart values (Screenshot 2)
  const getMonthlyAggregateData = () => {
    const localizedMonths: Record<Language, string[]> = {
      en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
      es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
    };
    
    const monthlyTotals = Array(12).fill(0);
    trips.forEach(trip => {
      const monthIdx = new Date(trip.date).getMonth();
      monthlyTotals[monthIdx] += trip.total;
    });

    const activeMonthLabels = localizedMonths[language] || localizedMonths.en;
    const currentMonth = new Date().getMonth();
    const last6 = [];
    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonth - i + 12) % 12;
      last6.push({
        label: activeMonthLabels[mIdx],
        value: monthlyTotals[mIdx]
      });
    }
    return last6;
  };

  const chartData = getMonthlyAggregateData();
  const maxSpendInChart = Math.max(10, ...chartData.map(d => d.value));

  // Store Brand spending summary
  const getStoreBreakdownData = () => {
    const stores: Record<string, number> = {};
    trips.forEach(trip => {
      const store = trip.storeName || 'Other';
      stores[store] = (stores[store] || 0) + trip.total;
    });

    return Object.entries(stores)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  };

  const storeBreakdown = getStoreBreakdownData();

  // Custom Store badge generator for aesthetic list grouping (German shops context)
  const renderStoreGroupTag = (name: string) => {
    const clean = name.toLowerCase().trim();
    if (clean.includes('lidl') || clean.includes('лидл')) {
      return (
        <span className="bg-[#00509D] text-[#FFD000] text-[9px] font-black tracking-wide px-2 py-0.5 rounded-md border border-[#FFD000]/30 select-none uppercase">
          Lidl
        </span>
      );
    }
    if (clean.includes('spar') || clean.includes('спар') || clean.includes('interspar')) {
      return (
        <span className="bg-[#E50014] text-white text-[9px] font-black tracking-wide px-2 py-0.5 rounded-md border border-red-400/20 select-none uppercase">
          Spar
        </span>
      );
    }
    if (clean.includes('aldi') || clean.includes('алди')) {
      return (
        <span className="bg-[#002B49] text-[#6FB3E8] text-[9px] font-black tracking-wide px-2 py-0.5 rounded-md border border-[#6FB3E8]/30 select-none uppercase">
          Aldi
        </span>
      );
    }
    if (clean.includes('rewe') || clean.includes('реве')) {
      return (
        <span className="bg-red-600 text-white text-[9px] font-black tracking-wide px-2 py-0.5 rounded-md select-none uppercase">
          Rewe
        </span>
      );
    }
    if (clean.includes('kaufland')) {
      return (
        <span className="bg-[#D31F26] text-white text-[9px] font-black tracking-wide px-2 py-0.5 rounded-md select-none uppercase">
          Kaufland
        </span>
      );
    }
    return (
      <span className="bg-[#FAF0E6] text-[#805B3A] text-[9.5px] font-extrabold px-2 py-0.5 rounded-md border border-[#E6DEC9] uppercase truncate max-w-[80px]">
        {name}
      </span>
    );
  };

  // --- PREMIUM CODE VALIDATION ---
  const handleVerifyPremiumCode = () => {
    const inputCode = activationCode.trim().toLowerCase();
    
    const now = new Date();
    const year = now.getFullYear();
    const monthIdx = now.getMonth(); // 0-indexed: 0=Jan, 5=Jun, 6=Jul
    
    let expectedCode = '';
    if (year === 2026 && monthIdx === 5) {
      expectedCode = 'iseerhinoceros';
    } else {
      const monthAbbrevs = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthStr = monthAbbrevs[monthIdx];
      const yearStr = String(year).slice(-2);
      expectedCode = `rhino${monthStr}${yearStr}`;
    }
    
    if (inputCode === expectedCode) {
      setSettings(prev => ({ ...prev, isPremium: true }));
      setActivationError('');
      setActivationCode('');
      playSuccessChime();
      triggerHaptic(85);
      setIsPremiumModalOpen(false);
    } else {
      setActivationError(t.premium.invalidCode);
      triggerHaptic(60);
    }
  };

  // --- EXPORT CSV UTILITY ---
  const exportCartToCSV = () => {
    if (trips.length === 0) return;
    triggerHaptic(30);

    const headers = 'Trip Date,Store Name,Budget At Trip,Total Cost,Items Count,Items List\n';
    const csvContent = trips.map(trip => {
      const formattedList = trip.items.map(it => `${it.name} (${it.quantity}${it.unit === 'kg' ? 'kg' : 'x'}@$${it.price.toFixed(2)})`).join(' | ');
      return `"${trip.date}","${trip.storeName.replace(/"/g, '""')}",${trip.budgetAtTrip},${trip.total},${trip.items.length},"${formattedList.replace(/"/g, '""')}"`;
    }).join('\n');

    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smartcart_trips_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save changes of edited Cart item modal
  const handleSaveEditedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setItems(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
    setEditingItem(null);
    playSuccessChime();
    triggerHaptic(30);
  };

  const latinKeys = isShiftActive 
    ? [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ü'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ñ', 'ß']
      ]
    : [
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'ü'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä'],
        ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'ñ', 'ß']
      ];

  const cyrillicKeys = isShiftActive
    ? [
        ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х', 'Ъ'],
        ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
        ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю']
      ]
    : [
        ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
        ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
        ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю']
      ];

  const numericKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', '⌫']
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1513] font-sans flex flex-col justify-between selection:bg-[#F2ECE0] pb-[100px] md:pb-6">
      
      {/* HEADER SECTION - SWISS / CREAM DESIGN STYLE */}
      <header className="bg-[#FAF8F5] border-b border-[#E6DEC9]/60 sticky top-0 z-30 px-4">
        <div className="max-w-4xl mx-auto py-4 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            {/* Header Swapping back-to-shopping Button (Screenshot 5) */}
            {activeTab !== 'scan' ? (
              <button
                onClick={() => {
                  setActiveTab('scan');
                  triggerHaptic(20);
                }}
                className="border border-[#E6DEC9]/85 text-[#E50014] bg-white rounded-full px-4 py-1.5 text-xs font-black flex items-center gap-1.5 hover:bg-[#FAF9F6] transition-colors cursor-pointer shadow-xs"
              >
                <Home className="w-3.5 h-3.5" />
                {t.common.home.toUpperCase()}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {/* Red Swiss style icon rectangle logo */}
                <div className="w-11 h-11 rounded-2xl bg-[#E50014] text-white flex items-center justify-center shadow-md relative">
                  <ShoppingCart className="w-5.5 h-5.5 flex-shrink-0" />
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#FAF8F5] rounded-full"></span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-black text-xl tracking-tight text-[#1A1513] leading-none">SmartCart</span>
                    {settings.isPremium && (
                      <span className="text-[8.5px] font-black text-white uppercase bg-[#E50014] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        👑 PLUS
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Language Switch pill (Screenshot 4) - Exact design from user screenshot */}
            <div className="relative inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#FFC9C9]/60 rounded-lg shadow-2xs hover:bg-[#FFF0F3] transition-all">
              <Globe className="w-3.5 h-3.5 text-[#E57373]" />
              <span className="text-[10px] font-black text-[#5C504F] uppercase tracking-wide">{language}</span>
              <select 
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value as Language);
                  triggerHaptic(25);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              >
                <option value="en">EN</option>
                <option value="de">DE</option>
                <option value="es">ES</option>
                <option value="ru">RU</option>
              </select>
            </div>

            {/* Wallet / Budget state icon card (Screenshot 4) */}
            <div className="bg-[#E8F5E9] border border-[#C8E6C9] font-extrabold text-xs text-[#2E7D32] px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs shrink-0 select-none">
              <Wallet className="w-4 h-4 text-[#2E7D32]" />
              <span>{settings.budget.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* CENTRALIZED MAIN CANVAS FRAME */}
      <main className="max-w-4xl mx-auto w-full px-4 py-5 flex-1">

        {/* TRANSITIONS BETWEEN VIEWS AND WORKSPACE PAGES */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: ADD ITEM SCREEN */}
          {activeTab === 'scan' && (
            <motion.div
              layoutId="form-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* TRIAL STATUS BANNER (Screenshot 1 / 4 / 8) */}
              {!settings.isPremium && (
                <div className="bg-[#FFF0F3] border border-[#FFC9C9] rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-[11px] font-bold text-[#E50014]">
                  <div className="flex items-center gap-1.5 uppercase font-black">
                    <span>
                      {language === 'ru' ? 'ПРОБНАЯ ВЕРСИЯ:' : 
                       language === 'de' ? 'TESTVERSION:' : 
                       language === 'es' ? 'PRUEBA:' : 'TRIAL:'}
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded-full border border-[#FFC9C9]/55 font-mono text-xs text-stone-800">
                      {trips.length}/5
                    </span>
                    <span className="text-[#805B3A] font-semibold lowercase pl-1.5 hidden sm:inline">
                      ({language === 'ru' ? `Осталось поездок: ${Math.max(0, 5 - trips.length)}` : 
                        language === 'de' ? `${Math.max(0, 5 - trips.length)} Einkäufe übrig` : 
                        language === 'es' ? `${Math.max(0, 5 - trips.length)} compras restantes` : `${Math.max(0, 5 - trips.length)} trips left`})
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => setIsPremiumModalOpen(true)}
                    className="bg-[#E50014] hover:bg-red-750 text-white px-3 py-1.2 rounded-lg text-[10px] font-black uppercase transition-colors shadow-3xs border-none cursor-pointer shrink-0"
                  >
                    {t.settings.upgrade}
                  </button>
                </div>
              )}

              {/* PRIMARY VISUAL FORM CONTROL CARD (Screenshot 1) */}
              <div className="bg-white rounded-[32px] p-6.5 border border-[#E6DEC9] shadow-xs">
                <div className="space-y-4">
                  {/* Name field card style */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#1A1513] uppercase tracking-wider pl-1 block">
                      {t.scan.productName}
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      onFocus={() => handleProductFieldFocus('name')}
                      inputMode="none"
                      placeholder={language === 'ru' ? 'например: Яблоки, Хлеб, Сыр...' : 
                                   language === 'de' ? 'z.B. Brot, Milch, Äpfel...' : 
                                   language === 'es' ? 'ej. Pan, Leche, Manzanas...' : 'e.g. Milk, Bread...'}
                      className="w-full bg-[#f9f6f0] border border-[#E6DEC9] focus:ring-2 focus:ring-[#E50014]/15 focus:border-[#E50014] focus:outline-none rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all placeholder-[#A19885]/70 text-[#1A1513]"
                    />
                  </div>

                  {/* Price field (Screenshot 1 shows large typeface for values) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#1A1513] uppercase tracking-wider pl-1 block">
                      {t.scan.price}
                    </label>
                    <input
                      type="text"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      onFocus={() => handleProductFieldFocus('price')}
                      inputMode="none"
                      placeholder="0.00"
                      className="w-full bg-[#f9f6f0] border border-[#E6DEC9] focus:ring-2 focus:ring-[#E50014]/15 focus:border-[#E50014] focus:outline-none rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all placeholder-[#A19885] text-[#1A1513]"
                    />
                  </div>
                </div>
              </div>

              {/* INLINE ACTION CART PILL (UNPINNED) */}
              {items.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setActiveTab('cart');
                      triggerHaptic(20);
                    }}
                    className="w-full bg-white border border-[#E6DEC9] hover:bg-[#FAF9F6] text-[#1A1513] font-black py-4 px-6 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-center justify-center gap-2.5 text-sm select-none active:scale-97 cursor-pointer"
                  >
                    <ShoppingCart className="w-5 h-5 text-[#E50014] shrink-0" />
                    <span>{t.cart.viewCart} ({items.length})</span>
                  </button>
                </div>
              )}

            </motion.div>
          )}

          {/* TAB 2: SHOPPING CART SCREEN */}
          {activeTab === 'cart' && (
            <motion.div
              layoutId="cart-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-[32px] p-6 border border-[#E6DEC9]/80 shadow-xs space-y-5">
                
                {/* SORT CONTROLS & ITEM STATUS GRID (Segment control aesthetic - Screenshot 5) */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E6DEC9]/40 pb-4">
                  <div className="space-y-0.5">
                    <h3 className="text-xl font-display font-black text-[#1A1513] tracking-tight">
                      {t.cart.title}
                    </h3>
                    <p className="text-xs text-[#A19885] font-extrabold uppercase">
                      {items.length} {items.length === 1 ? t.cart.item : t.cart.items}
                    </p>
                  </div>

                  {items.length > 0 && (
                    <div className="flex items-center gap-3 bg-[#FAF6EC] p-1 rounded-full border border-[#E6DEC9]">
                      <button
                        onClick={() => {
                          setSortBy('name');
                          triggerHaptic(10);
                        }}
                        className={`text-[9.5px] font-black uppercase px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                          sortBy === 'name' 
                            ? 'bg-white text-[#1A1513] shadow-xs border border-[#E6DEC9]/50' 
                            : 'text-[#A19885] hover:text-[#786D58]'
                        }`}
                      >
                        {t.cart.sortName}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('price');
                          triggerHaptic(10);
                        }}
                        className={`text-[9.5px] font-black uppercase px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                          sortBy === 'price' 
                            ? 'bg-white text-[#1A1513] shadow-xs border border-[#E6DEC9]/50' 
                            : 'text-[#A19885] hover:text-[#786D58]'
                        }`}
                      >
                        {t.cart.sortPrice}
                      </button>
                      <button
                        onClick={() => {
                          setSortBy('quantity');
                          triggerHaptic(10);
                        }}
                        className={`text-[9.5px] font-black uppercase px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                          sortBy === 'quantity' 
                            ? 'bg-white text-[#1A1513] shadow-xs border border-[#E6DEC9]/50' 
                            : 'text-[#A19885] hover:text-[#786D58]'
                        }`}
                      >
                        {t.cart.sortQuantity}
                      </button>
                    </div>
                  )}
                </div>

                {/* Items row list mapping */}
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  {sortedItems.map((item) => {
                    const formattedUnitLabel = item.unit === 'kg' ? 'kg' : t.common.each;
                    const rowTotal = item.price * item.quantity;
                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-[24px] p-5 border border-[#E6DEC9] shadow-xs flex items-center justify-between gap-4 transition-all ${
                          !item.completed ? 'opacity-40 bg-stone-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-1 flex-1 min-w-0">
                          <div className="space-y-1 min-w-0 flex-1">
                            {/* Product Name (Natural case, bold, text-sm/text-base) */}
                            <p 
                              onClick={() => toggleItemCompleted(item.id)}
                              className={`font-bold text-[#1A1513] hover:text-[#E50014] cursor-pointer transition-colors text-[15px] tracking-tight ${
                                !item.completed ? 'line-through text-[#A19885] font-semibold' : ''
                              }`}
                            >
                              {item.name}
                            </p>
                            
                            {/* Metadata container: [x1] 1.50 (1.50 each) */}
                            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                              {/* Quantity badge */}
                              <span className="bg-[#FAF0E6] text-[#805B3A] font-extrabold text-[10px] px-2.5 py-0.5 rounded-[8px] border border-[#E6DEC9] select-none font-sans lowercase">
                                x{item.quantity}
                              </span>
                              
                              {/* Row Total Price in premium RED - no dollar sign prefix as requested */}
                              <span className="text-[#E50014] font-black text-sm">
                                {rowTotal.toFixed(2)}
                              </span>
                              
                              {/* Unit Price */}
                              <span className="text-[#A19885] text-[11px] font-bold">
                                ({item.price.toFixed(2)} {formattedUnitLabel})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right side: Action Controllers (Pencil & Trash bin inline - Screenshot en2) */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Edit Action Button */}
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              triggerHaptic(20);
                            }}
                            className="text-[#A19885] hover:text-stone-700 p-1 rounded-lg"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Action Button */}
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="text-[#A19885] hover:text-[#E50014] p-1 rounded-lg transition-colors cursor-pointer"
                            title={t.common.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {items.length === 0 && (
                    <div className="text-center py-12 text-[#A19885] text-xs font-semibold px-4 space-y-4">
                      <div className="w-16 h-16 bg-[#F7F5F0] rounded-3xl flex items-center justify-center mx-auto border border-dashed border-[#E6DEC9]">
                        <ShoppingCart className="w-7 h-7 text-[#A19885]/70" />
                      </div>
                      <p>{t.cart.empty}</p>
                      
                      <button
                        onClick={() => {
                          setActiveTab('scan');
                          triggerHaptic(20);
                        }}
                        className="px-5 py-2.5 bg-[#E50014] text-white rounded-xl font-black text-[10.5px] uppercase tracking-wide shadow-xs border-none cursor-pointer hover:bg-red-700 hover:scale-102 transition-transform active:scale-95"
                      >
                        {language === 'ru' ? 'Добавить товар' : 
                         language === 'de' ? 'Artikel hinzufügen' : 
                         language === 'es' ? 'Añadir artículo' : 'Add first item'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Optional Store Name selector inputs */}
                {items.length > 0 && (
                  <div className="pt-4 border-t border-[#E6DEC9]/40 space-y-2">
                    <label className="text-[9.5px] font-extrabold text-[#786D58] uppercase tracking-widest pl-1 block">
                      {t.cart.storeName}
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      onFocus={() => registerActiveInput('storeNameCart', language === 'ru' ? 'МАГАЗИН (НАЗВАНИЕ)' : 'STORE NAME', 'text', storeName, setStoreName)}
                      inputMode="none"
                      placeholder="e.g. Lidl, Spar, Rewe, Aldi..."
                      className="w-full bg-[#F7F5F0] border border-[#E6DEC9] focus:ring-1 focus:ring-[#E50014] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-semibold placeholder:text-[#A19885]"
                    />
                  </div>
                )}

                {/* PRETTY MOSS GREEN TOTAL DISPLAY TRAY AND BOTTOM CONTROLLERS (Screenshot 5) */}
                {items.length > 0 && (
                  <div className="pt-3.5 space-y-4">
                    {/* Sage Green Banner Card matching en2.png backdrop `#7B9D96` */}
                    <div className="bg-[#7B9D96] text-white p-5 rounded-[24px] flex items-center justify-between shadow-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-black tracking-widest text-[#E8F5E9]/80 block">
                          {t.cart.total}
                        </span>
                        <span className="text-3xl font-black tracking-tight font-mono">
                          {formattedCartTotal.toFixed(2)}
                        </span>
                      </div>
                      
                      {/* White semi-translucent Wallet card bag icon decoration */}
                      <div className="bg-white/10 rounded-2xl p-3 text-white border border-white/15 shadow-2xs select-none">
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {/* Big Muted Green Checkout finish Button matching en2.png backdrop `#749F7B` */}
                      <button
                        onClick={handleCheckoutTrip}
                        className="w-full py-4 bg-[#749F7B] hover:bg-[#638F6A] text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-97 transition-all text-xs uppercase tracking-wider cursor-pointer border-none"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {t.cart.checkout}
                      </button>

                      <div className="grid grid-cols-2 gap-2.5">
                        {/* White Return Shopping button */}
                        <button
                          onClick={() => {
                            setActiveTab('scan');
                            triggerHaptic(15);
                          }}
                          className="py-3.5 border-2 border-[#E6DEC9] text-[#786D58] hover:bg-[#F2ECE0] bg-transparent font-black rounded-2xl text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          ⬅ {t.cart.returnToShopping}
                        </button>

                        {/* Trash clear basket */}
                        <button
                          onClick={() => {
                            clearCurrentCart();
                            triggerHaptic(40);
                          }}
                          className="py-3.5 bg-rose-50 border border-rose-200 text-[#E50014] hover:bg-rose-100/50 font-black rounded-2xl text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          🗑️ {t.cart.clear}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* TAB 3: SPENDING STATISTICS */}
          {activeTab === 'stats' && (
            <motion.div
              layoutId="stats-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-display font-black text-[#1A1513] tracking-tight">
                    {language === 'ru' ? 'Статистика расходов' : 
                     language === 'de' ? 'Ausgabenstatistik' : 
                     language === 'es' ? 'Estadísticas de gastos' : 'Spending Statistics'}
                  </h2>
                </div>

                {/* Buttons section: '+' square and 'EXPORT CSV' */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      setActiveTab('scan');
                      triggerHaptic(20);
                    }}
                    className="w-12 h-12 bg-white hover:bg-[#FAF8F5] border border-[#E6DEC9] rounded-2xl flex items-center justify-center text-stone-500 hover:text-stone-800 transition-all cursor-pointer shadow-3xs"
                    title="Add product"
                  >
                    <span className="text-xl font-bold">+</span>
                  </button>

                  <button
                    onClick={exportCartToCSV}
                    className="h-12 bg-white hover:bg-[#FAF8F5] border border-[#E50014] rounded-2xl px-5 text-xs font-black uppercase text-[#E50014] tracking-wider flex items-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    <Download className="w-4 h-4 text-[#E50014]" />
                    <span>
                      {language === 'ru' ? 'ЭКСПОРТ CSV' : 
                       language === 'de' ? 'EXPORTIEREN CSV' : 
                       language === 'es' ? 'EXPORTAR CSV' : 'EXPORT CSV'}
                    </span>
                  </button>
                </div>
              </div>

              {/* SEARCH & CALCULATION DETAIL CARD */}
              <div className="bg-white rounded-[24px] p-5.5 border border-[#E6DEC9] shadow-xs space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={language === 'ru' ? 'Поиск по магазину' : 
                                 language === 'de' ? 'Suche nach Geschäft' : 
                                 language === 'es' ? 'Buscar por Tienda' : 'Search by shop'}
                    className="w-full bg-[#f9f6f0] border border-[#E6DEC9] focus:ring-2 focus:ring-[#E50014]/15 focus:outline-none rounded-2xl px-5 py-3.5 text-sm font-semibold tracking-wide placeholder-[#A19885]/70 text-[#1A1513]"
                  />
                </div>

                {/* Monthly Expense & Average Card with trend */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 text-xs font-black text-[#E50014] uppercase tracking-wider mb-2.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>
                      {language === 'ru' ? 'Ежемесячные расходы / среднее' : 
                       language === 'de' ? 'Monatsausgaben / Durchschnitt' : 
                       language === 'es' ? 'Gasto Mensual / promedio' : 'Monthly spending & average'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#FAF8F5] border border-[#E6DEC9]/65 rounded-2xl p-4.5 flex flex-col justify-between gap-1.5 font-bold">
                      <span className="text-[10px] text-stone-500 uppercase tracking-widest block leading-none">
                        {new Date().toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
                      </span>
                      <span className="text-xl font-black text-[#1A1513] font-mono block mt-2">
                        {statsTotalSpent.toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-[#FAF8F5] border border-[#E6DEC9]/65 rounded-2xl p-4.5 flex flex-col justify-between gap-1.5 font-bold">
                      <span className="text-[10px] text-stone-500 uppercase tracking-widest block leading-none">
                        {language === 'ru' ? 'СРЕДНЕЕ В МЕСЯЦ' : 
                         language === 'de' ? 'MONATLICHER DURCHSCHNITT' : 
                         language === 'es' ? 'PROMEDIO MENSUAL' : 'MONTHLY AVERAGE'}
                      </span>
                      <span className="text-xl font-black text-[#E50014] font-mono block mt-2">
                        {monthlyAverage.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TIMELINE ROSTER ROWS */}
              <div className="bg-white rounded-[24px] p-5.5 border border-[#E6DEC9] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6DEC9]/35 pb-3">
                  <span className="text-xs font-black tracking-widest uppercase text-[#786D58] block pl-1">
                    {language === 'ru' ? 'Последние покупки' : 
                     language === 'de' ? 'Letzte Einkäufe' : 
                     language === 'es' ? 'Compras recientes' : 'Recent trips'}
                  </span>

                  {trips.length > 0 && (
                    <button 
                      onClick={() => setIsConfirmClearOpen(true)}
                      className="text-[10px] font-black text-red-650 hover:text-red-850 uppercase tracking-wider bg-transparent border-none cursor-pointer p-0"
                    >
                      {language === 'ru' ? 'Очистить историю' : 
                       language === 'de' ? 'Verlauf löschen' : 
                       language === 'es' ? 'Borrar historial' : 'Clear history'}
                    </button>
                  )}
                </div>

                {/* Trips mapping rows */}
                <div className="space-y-3.5">
                  {filteredTrips.map((trip) => {
                    const parsedDate = new Date(trip.date);
                    const formattedDate = parsedDate.toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : 'en-US', { 
                      day: 'numeric', month: 'short'
                    });

                    const itemsLabel = language === 'ru' ? `${trip.items.length} ${getRussianGoodsWord(trip.items.length)}` : 
                                       language === 'de' ? `${trip.items.length} ARTIKEL` : 
                                       language === 'es' ? `${trip.items.length} ARTÍCULOS` : `${trip.items.length} ITEMS`;

                    return (
                      <div 
                        key={trip.id} 
                        onClick={() => {
                          setSelectedTrip(trip);
                          triggerHaptic(20);
                        }}
                        className="bg-white border border-[#E6DEC9] p-4.5 rounded-2xl flex items-center justify-between hover:border-red-400 hover:bg-[#FAF8F5]/50 transition-all cursor-pointer shadow-3xs"
                      >
                        <div className="space-y-2 min-w-0 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#1A1513]">{formattedDate}</span>
                            <span className="bg-[#FAF0E6] text-[#805B3A] border border-[#E6DEC9] font-black text-[9.5px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                              {trip.storeName}
                            </span>
                          </div>
                          
                          <span className="text-[9.5px] text-[#A19885] font-black uppercase tracking-widest block leading-none font-sans">
                            {itemsLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-black text-[#1A1513] font-mono tracking-tight">
                            {trip.total.toFixed(2)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#A19885]" />
                        </div>
                      </div>
                    );
                  })}

                  {filteredTrips.length === 0 && (
                    <div className="text-center py-12 text-[#A19885] text-xs font-semibold">
                      {trips.length === 0 ? t.stats.empty : t.stats.noResults}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: SETTINGS SCREEN */}
          {activeTab === 'settings' && (
            <motion.div
              layoutId="settings-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4 max-w-lg mx-auto"
            >
              {/* CARD 1: BUDGET (TWO LINE / FULL FIELD) */}
              <div className="bg-white rounded-[24px] p-5.5 border border-[#E6DEC9] shadow-xs flex flex-col gap-3">
                <h3 className="text-sm font-bold text-[#1A1513] font-sans">
                  {t.settings.budget}
                </h3>
                <div className="relative w-full">
                  <input
                    type="number"
                    min="5"
                    value={settings.budget}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setSettings(prev => ({ ...prev, budget: val }));
                    }}
                    className="w-full text-left bg-[#FAF8F5] border border-[#E6DEC9] focus:ring-2 focus:ring-[#E50014]/15 focus:outline-none rounded-2xl px-4 py-3 text-sm font-semibold text-[#1A1513]"
                  />
                </div>
              </div>

              {/* CARD 2: SOUND SWITCHER */}
              <div className="bg-white rounded-[24px] p-5.5 border border-[#E6DEC9] shadow-xs flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#1A1513] font-sans">
                    {t.settings.sound}
                  </h3>
                  <p className="text-[11px] text-[#A19885] font-semibold mt-1">
                    Test the item addition sound
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
                    triggerHaptic(20);
                    try {
                      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const osc = ctx.createOscillator();
                      const gain = ctx.createGain();
                      osc.connect(gain);
                      gain.connect(ctx.destination);
                      osc.frequency.setValueAtTime(800, ctx.currentTime);
                      gain.gain.setValueAtTime(0.08, ctx.currentTime);
                      osc.start();
                      osc.stop(ctx.currentTime + 0.12);
                    } catch (e) {}
                  }}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer ${
                    settings.soundEnabled 
                      ? 'bg-[#FFEBEB] text-[#E50014]' 
                      : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* CARD 3: SMARTCART PLUS */}
              <div className="bg-white rounded-[24px] p-5.5 border border-[#E6DEC9] shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <Crown className="w-5 h-5 text-[#E50014] shrink-0 pt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-[#1A1513] font-sans">
                        {t.settings.premiumTitle}
                      </h3>
                      <p className="text-[11px] text-[#A19885] font-semibold mt-1 leading-normal">
                        Get SmartCart Plus for a symbolic $2.00
                      </p>
                    </div>
                  </div>

                  {!settings.isPremium && (
                    <a
                      href="https://ko-fi.com/georgech"
                      target="_blank"
                      rel="noreferrer noopener"
                      onClick={() => triggerHaptic(30)}
                      className="px-4.5 py-2 bg-[#E50014] hover:bg-[#C40011] text-white text-xs font-black rounded-full transition-all active:scale-95 text-center decoration-none inline-flex items-center justify-center shrink-0"
                    >
                      {t.settings.upgrade}
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-[11px] text-[#786D58] font-bold border-b border-[#E6DEC9]/40 pb-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Check className="w-3.5 h-3.5 text-[#E50014] shrink-0" />
                    <span className="truncate">{t.premium.unlimitedShopping}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Check className="w-3.5 h-3.5 text-[#E50014] shrink-0" />
                    <span className="truncate">{t.premium.statsUnlocked}</span>
                  </div>
                </div>

                {!settings.isPremium ? (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold tracking-wider text-[#A19885] uppercase">
                      {t.premium.activationCode}
                    </h4>
                    
                    <div className="flex gap-2.5">
                      <input
                        type="text"
                        value={activationCode}
                        onChange={(e) => setActivationCode(e.target.value)}
                        onFocus={() => registerActiveInput('activationCode', t.premium.orEnterCode, 'text', activationCode, setActivationCode)}
                        inputMode="none"
                        placeholder={t.premium.activationPlaceholder.toUpperCase()}
                        className="flex-1 bg-[#FAF8F5] border border-[#E6DEC9] focus:outline-none focus:ring-2 focus:ring-[#E50014]/15 rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPremiumCode}
                        className="bg-[#FAF8F5] hover:bg-[#FAF9F6] border border-[#E6DEC9] text-[#1A1513] text-xs font-black px-4.5 py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>

                    {activationError && (
                      <p className="text-[10px] font-bold text-red-650 uppercase animate-pulse">
                        ⚠️ {activationError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-150 text-emerald-800 text-xs font-extrabold flex items-center gap-2">
                    <span>🎉</span>
                    <p>{t.settings.adFree}</p>
                  </div>
                )}
              </div>

              {/* CARD 4: STORAGE & OFFLINE */}
              <div className="bg-white rounded-[24px] p-5.5 border border-[#E6DEC9] shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-[#1A1513] font-sans">
                      {t.settings.storage}
                    </h3>
                    <p className="text-[11px] text-[#A19885] font-semibold mt-1">
                      Data is saved locally on this device
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-[9px] font-bold uppercase text-emerald-850 bg-emerald-50 border border-emerald-200 rounded-full flex items-center gap-1 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {t.settings.online}
                  </span>
                </div>
                
                <div className="bg-[#FAF8F5] rounded-xl p-3.5 border border-[#E6DEC9]/65 flex items-center gap-2.5 text-[#805B3A]">
                  <span className="text-xs shrink-0">⚡</span>
                  <p className="text-[11px] font-semibold leading-relaxed">
                    {t.settings.offlineEnabled}
                  </p>
                </div>
              </div>

              {/* CARD 5: PRIVACY LETTER */}
              <button
                onClick={() => {
                  setIsPrivacyOpen(true);
                  triggerHaptic(20);
                }}
                className="w-full bg-white rounded-[24px] p-5.5 border border-[#E6DEC9] shadow-xs flex items-center justify-between text-left hover:bg-[#FAF9F6] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FFEBEB] text-[#E50014] rounded-2xl flex items-center justify-center shrink-0">
                    <Shield className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1513] font-sans">
                      {t.settings.privacyLetter}
                    </h3>
                    <p className="text-[11px] text-[#A19885] font-semibold mt-0.5">
                      Security & Data approach
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#A19885]" />
              </button>

              {/* CARD 6: AMAZON FEEDBACK */}
              <div className="bg-white rounded-[24px] p-5.5 border border-[#E6DEC9] shadow-xs flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 border border-amber-100 flex items-center justify-center rounded-2xl shrink-0">
                    <span className="text-base">⭐</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1513] font-sans">
                      {language === 'ru' ? 'Отзывы на Amazon' : 
                       language === 'de' ? 'Amazon Bewertung' : 
                       language === 'es' ? 'Comentarios en Amazon' : 'Amazon Feedback'}
                    </h3>
                    <p className="text-[11px] text-[#A19885] font-semibold mt-0.5">
                      {language === 'ru' ? 'Поделитесь мнением или поставьте оценку' : 
                       language === 'de' ? 'Geben Sie uns Bewertung oder Feedback' : 
                       language === 'es' ? 'Por favor califícanos o danos tu opinión' : 'Give us a rating or feedback on Amazon'}
                    </p>
                  </div>
                </div>
                <a
                  href="https://www.amazon.com/dp/B0H4WVH7XY"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => triggerHaptic(20)}
                  className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#FAF9F6] border border-[#E6DEC9] text-[#1A1513] text-xs font-black rounded-full transition-all shadow-xs flex items-center gap-1 cursor-pointer no-underline shrink-0"
                >
                  <span>Rate</span>
                  <span className="text-[10px]">⭐</span>
                </a>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FIXED NAVIGATION TAB BAR BAR AT THE BOTTOM (Screenshot 1 / 5) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E6DEC9] z-30 shadow-md">
        <div className="max-w-xl mx-auto px-4 h-18 flex items-center justify-between">
          
          {/* Nav Tab 1: Add Item */}
          <button
            onClick={() => {
              setActiveTab('scan');
              triggerHaptic(20);
            }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all cursor-pointer border-none bg-transparent ${
              activeTab === 'scan' ? 'text-[#E50014] scale-102 font-black' : 'text-[#A19885] hover:text-stone-600'
            }`}
          >
            <Plus className="w-5.5 h-5.5 flex-shrink-0" />
            <span className="text-[9.5px] tracking-wide uppercase font-black">{t.nav.scan}</span>
          </button>

          {/* Nav Tab 2: Shopping Cart */}
          <button
            onClick={() => {
              setActiveTab('cart');
              triggerHaptic(20);
            }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all cursor-pointer relative border-none bg-transparent ${
              activeTab === 'cart' ? 'text-[#E50014] scale-102 font-black' : 'text-[#A19885] hover:text-slate-600'
            }`}
          >
            <ShoppingCart className="w-5.5 h-5.5 flex-shrink-0" />
            {items.length > 0 && (
              <span className="absolute top-0 right-[22%] bg-[#E50014] text-white font-extrabold font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs border border-white">
                {items.length}
              </span>
            )}
            <span className="text-[9.5px] tracking-wide uppercase font-black">{t.nav.cart}</span>
          </button>

          {/* Nav Tab 3: Spend Statistics */}
          <button
            onClick={() => {
              setActiveTab('stats');
              triggerHaptic(20);
            }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all cursor-pointer border-none bg-transparent ${
              activeTab === 'stats' ? 'text-[#E50014] scale-102 font-black' : 'text-[#A19885] hover:text-slate-600'
            }`}
          >
            <TrendingUp className="w-5.5 h-5.5 flex-shrink-0" />
            <span className="text-[9.5px] tracking-wide uppercase font-black">{t.nav.stats}</span>
          </button>

          {/* Nav Tab 4: Settings */}
          <button
            onClick={() => {
              setActiveTab('settings');
              triggerHaptic(20);
            }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all cursor-pointer border-none bg-transparent ${
              activeTab === 'settings' ? 'text-[#E50014] scale-102 font-black' : 'text-[#A19885] hover:text-slate-600'
            }`}
          >
            <SettingsIcon className="w-5.5 h-5.5 flex-shrink-0" />
            <span className="text-[9.5px] tracking-wide uppercase font-black">
              {language === 'ru' ? 'Настройки' : 
               language === 'de' ? 'Einstellungen' : 
               language === 'es' ? 'Ajustes' : 'Settings'}
            </span>
          </button>

        </div>
      </nav>

      {/* --- DRAWER AND DIALOG MODALS CONTROLLERS --- */}
      
      {/* 1. Privacy Policy Letter Modal */}
      <AnimatePresence>
        {isPrivacyOpen && (
          <div className="fixed inset-0 bg-[#1A1513]/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-[32px] overflow-hidden relative shadow-2xl border border-[#E6DEC9]"
            >
              <button 
                onClick={() => setIsPrivacyOpen(false)}
                className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-2 hover:bg-[#FAF8F5] rounded-xl z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-1 max-h-[85vh] overflow-y-auto">
                <PrivacyPolicy language={language} onClose={() => setIsPrivacyOpen(false)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Brand Shop Name Custom popup editor */}
      <AnimatePresence>
        {isStorePopupOpen && (
          <div className="fixed inset-0 bg-[#1A1513]/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[32px] p-6 shadow-2xl space-y-4 border border-[#E6DEC9]"
            >
              <div className="flex items-center justify-between border-b border-[#E6DEC9]/40 pb-3">
                <h3 className="text-base font-display font-black text-[#1A1513] flex items-center gap-1.5 uppercase">
                  <Store className="w-4.5 h-4.5 text-[#E50014]" />
                  {t.shopPopup.title}
                </h3>
                <button 
                  onClick={() => setIsStorePopupOpen(false)}
                  className="text-[#A19885] hover:text-stone-700 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-[#805B3A] font-bold leading-relaxed">
                  {t.shopPopup.instruction}
                </p>

                <input
                  type="text"
                  required
                  value={storeInput}
                  onChange={(e) => setStoreInput(e.target.value)}
                  onFocus={() => registerActiveInput('storePopup', t.cart.storeName, 'text', storeInput, setStoreInput)}
                  inputMode="none"
                  placeholder="e.g. Lidl, Spar, Rewe, Aldi..."
                  className="w-full bg-[#F7F5F0] border border-[#E6DEC9] focus:ring-2 focus:ring-[#E50014]/20 focus:outline-none rounded-2xl px-4 py-3 text-sm font-semibold text-[#1A1513]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (storeInput.trim()) {
                        setStoreName(storeInput.trim());
                        setIsStorePopupOpen(false);
                        triggerHaptic(20);
                      }
                    }
                  }}
                />

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsStorePopupOpen(false);
                      triggerHaptic(15);
                    }}
                    className="flex-1 py-3 text-[#A19885] hover:text-stone-700 text-xs font-black uppercase tracking-wider hover:bg-[#FAF8F5] rounded-xl cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>

                  <button
                    type="button"
                    disabled={!storeInput.trim()}
                    onClick={() => {
                      if (storeInput.trim()) {
                        setStoreName(storeInput.trim());
                        setIsStorePopupOpen(false);
                        triggerHaptic(20);
                      }
                    }}
                    className="flex-1 py-3 bg-[#E50014] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    {t.common.save}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Trial Ended Block / Plus Modals */}
      <AnimatePresence>
        {isPremiumModalOpen && (
          <div className="fixed inset-0 bg-[#1A1513]/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-gradient-to-tr from-[#E50014] to-red-600 rounded-[32px] p-6 text-white shadow-2xl relative space-y-6"
            >
              <button 
                onClick={() => setIsPremiumModalOpen(false)}
                className="absolute top-5 right-5 text-red-200 hover:text-white p-2 hover:bg-white/10 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2 border-b border-white/20 pb-4">
                <h3 className="text-xl font-display font-black flex items-center gap-1.5 text-yellow-300">
                  <Sparkles className="w-5 h-5 animate-bounce fill-yellow-300 text-yellow-300" />
                  {t.premium.trialEnded}
                </h3>
                <p className="text-xs text-red-100 font-semibold leading-relaxed">
                  {t.premium.trialEndedDesc}
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-300">
                  👑 Premium Member Perks:
                </span>
                <ul className="space-y-2 text-xs text-red-50 font-black">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>{t.premium.unlimitedShopping}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>{t.premium.statsUnlocked}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Free Lifetime updates completely offline</span>
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="bg-white/10 border border-white/10 p-4 rounded-2xl space-y-2.5">
                  <h4 className="text-xs font-black text-yellow-300 uppercase tracking-widest">
                    {t.premium.donateHeadline}
                  </h4>
                  <p className="text-[10px] text-red-100 leading-normal font-sans font-medium">
                    {t.premium.donateDescription}
                  </p>
                  <a
                    href="https://ko-fi.com/georgech"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="w-full inline-flex items-center justify-center py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black text-xs transition-all shadow-md decoration-none"
                    onClick={() => triggerHaptic(30)}
                  >
                    🚀 {t.premium.donateAction}
                  </a>
                </div>

                <div className="bg-white/10 border border-white/10 p-4 rounded-2xl space-y-2.5">
                  <h4 className="text-xs font-extrabold text-yellow-300 uppercase tracking-widest">
                    {t.premium.orEnterCode}
                  </h4>
                  <p className="text-[10px] text-red-100 leading-normal font-sans font-medium">
                    {t.premium.activationHelp}
                  </p>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value)}
                      onFocus={() => registerActiveInput('activationCode', t.premium.orEnterCode, 'text', activationCode, setActivationCode)}
                      inputMode="none"
                      placeholder={t.premium.activationPlaceholder}
                      className="w-full bg-white/10 border border-white/20 text-center text-white focus:outline-none focus:ring-2 focus:ring-yellow-300 rounded-xl py-2 px-3 text-xs font-mono font-bold uppercase"
                    />
                    
                    {activationError && (
                      <p className="text-[10px] font-bold text-red-100 text-center uppercase animate-pulse">
                        ⚠️ {activationError}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleVerifyPremiumCode}
                      className="w-full py-2 bg-white text-red-600 hover:bg-red-50 rounded-xl font-black text-xs transition-all cursor-pointer border-none"
                    >
                      Verify Code
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Delete History Confirmation Modal */}
      <AnimatePresence>
        {isConfirmClearOpen && (
          <div className="fixed inset-0 bg-[#1A1513]/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[32px] p-6 shadow-2xl border border-[#E6DEC9] space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FFF5F5] text-[#E50014] flex items-center justify-center mx-auto mb-2 border border-red-100">
                <Trash2 className="w-6 h-6 animate-bounce" />
              </div>
              
              <div className="text-center space-y-1">
                <h3 className="text-base font-display font-black text-[#1A1513] uppercase">
                  Delete All Spending History?
                </h3>
                <p className="text-xs text-[#805B3A] px-4 font-bold">
                  {t.cart.confirmClear}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmClearOpen(false)}
                  className="flex-1 py-3 text-[#A19885] hover:text-stone-700 text-xs font-black uppercase cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={clearAllHistory}
                  className="flex-1 py-3 bg-[#E50014] hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase transition-colors cursor-pointer"
                >
                  {t.common.delete}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. EXPANDED TRIP DETAILS DRAWER SHEET (Screenshot 6) */}
      <AnimatePresence>
        {selectedTrip && (
          <div className="fixed inset-0 bg-[#1A1513]/60 backdrop-blur-2xs z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            
            {/* Dark background clicker wrapper */}
            <div className="absolute inset-0" onClick={() => setSelectedTrip(null)} />
            
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full sm:max-w-xl bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border-t sm:border border-[#E6DEC9] z-10 relative max-h-[85vh] sm:max-h-[80vh] flex flex-col justify-between"
            >
              <div className="overflow-y-auto space-y-5 flex-1 pr-1">
                
                {/* Header title store and close capsule (en3) */}
                <div className="flex items-start justify-between border-b border-[#E6DEC9]/40 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-display font-black text-[#1A1513] tracking-tight">
                      {selectedTrip.storeName}
                    </h3>
                    <span className="text-[10px] tracking-widest font-black text-[#A19885] uppercase block mt-0.5">
                      {new Date(selectedTrip.date).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', { 
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
                      }).toUpperCase()}
                    </span>
                  </div>

                  <button 
                    onClick={() => setSelectedTrip(null)}
                    className="bg-[#F2ECE4] text-[#82756A] rounded-full p-2.5 hover:bg-[#E8DFC2] transition-colors cursor-pointer border-none shadow-2xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* List items grids (en3) */}
                <div className="space-y-2.5 pt-1">
                  {selectedTrip.items.map((it, idx) => {
                    const uppercaseUnit = it.unit === 'kg' ? 'KG' : (it.quantity === 1 ? 'UNIT' : 'PCS');
                    return (
                      <div 
                        key={idx}
                        className="bg-[#FAF8F5] border border-[#E6DEC9]/40 rounded-2xl p-4.5 flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <h4 className="font-bold text-sm text-[#1A1513] normal-case">
                            {it.name.toLowerCase()}
                          </h4>
                          <span className="text-[10.5px] font-mono font-bold text-[#A19885] uppercase block mt-0.5">
                            {it.quantity} {uppercaseUnit} × {it.price.toFixed(2)}
                          </span>
                        </div>

                        <strong className="text-sm font-black text-[#1A1513] shrink-0 font-mono">
                          {(it.price * it.quantity).toFixed(2)}
                        </strong>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Total finalization tray (en3) */}
              <div className="bg-[#FAF6EC] border border-[#E9E2CE] rounded-[24px] p-5 flex items-center justify-between mt-5">
                <span className="text-xs font-black text-[#A19885] uppercase tracking-wider">
                  TOTAL AMOUNT
                </span>

                <strong className="text-2xl font-mono font-black text-[#E50014]">
                  {selectedTrip.total.toFixed(2)}
                </strong>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. DYNAMIC EDIT CART ITEM MODAL (High usability support) */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 bg-[#1A1513]/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[32px] p-6 shadow-2xl border border-[#E6DEC9] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#E6DEC9]/40 pb-3">
                <h3 className="text-base font-display font-black text-[#1A1513] uppercase">
                  {t.common.editItem}
                </h3>
                <button 
                  onClick={() => setEditingItem(null)}
                  className="text-[#A19885] hover:text-stone-700 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedItem} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold text-[#786D58] uppercase block">
                    {t.scan.productName}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.name}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                    onFocus={() => registerActiveInput('editItemName', t.scan.productName, 'text', editingItem.name, (val) => setEditingItem(prev => prev ? { ...prev, name: val } : null))}
                    inputMode="none"
                    className="w-full bg-[#F7F5F0] border border-[#E6DEC9] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1A1513]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-extrabold text-[#786D58] uppercase block">
                      {t.scan.price} ($)
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.price}
                      onChange={(e) => setEditingItem(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                      onFocus={() => registerActiveInput('editItemPrice', t.scan.price, 'numeric', editingItem.price.toString(), (val) => setEditingItem(prev => prev ? { ...prev, price: parseFloat(val) || 0 } : null))}
                      inputMode="none"
                      className="w-full bg-[#F7F5F0] border border-[#E6DEC9] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1A1513] font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-extrabold text-[#786D58] uppercase block">
                      {t.cart.quantity}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.quantity}
                      onChange={(e) => setEditingItem(prev => prev ? { ...prev, quantity: parseFloat(e.target.value) || 1 } : null)}
                      onFocus={() => registerActiveInput('editItemQty', t.cart.quantity, 'numeric', editingItem.quantity.toString(), (val) => setEditingItem(prev => prev ? { ...prev, quantity: parseFloat(val) || 1 } : null))}
                      inputMode="none"
                      className="w-full bg-[#F7F5F0] border border-[#E6DEC9] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1A1513] font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 py-3 text-[#A19885] hover:text-stone-700 text-xs font-black uppercase hover:bg-[#FAF8F5] rounded-xl cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#E50014] hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase transition-colors cursor-pointer"
                  >
                    {t.common.saveChanges}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. PRODUCT ADDING INTERCEPT: QUANTITY & UNIT SELECTOR POPUP */}
      <AnimatePresence>
        {pendingItemToAdd && (
          <div className="fixed inset-0 bg-[#1A1513]/60 backdrop-blur-2xs z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[480px] bg-white rounded-[32px] p-6.5 shadow-2xl border border-[#E6DEC9] space-y-4.5"
            >
              <div className="text-center space-y-1">
                <h3 className="text-lg font-display font-black text-[#1A1513] uppercase tracking-tight">
                  {language === 'ru' ? 'Выберите количество' : 
                   language === 'de' ? 'Menge wählen' : 
                   language === 'es' ? 'Seleccionar cantidad' : 'Select Quantity'}
                </h3>
                <p className="text-[#805B3A] text-[12px] font-black uppercase">
                  {pendingItemToAdd.name} — {pendingItemToAdd.price.toFixed(2)}
                </p>
              </div>

              {/* Quantity display & quick step counter */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 bg-[#F9F6F0] border border-[#E6DEC9] rounded-2xl p-2 px-4">
                  <button
                    type="button"
                    onClick={() => {
                      const step = pendingUnit === 'kg' ? 0.1 : 1;
                      setQuantityInputStr(prev => {
                        const cur = parseFloat(prev) || 0;
                        const res = Math.max(step, cur - step);
                        return pendingUnit === 'kg' ? res.toFixed(1) : Math.round(res).toString();
                      });
                      setIsQuantityModified(true);
                      triggerHaptic(15);
                    }}
                    className="w-11 h-11 bg-white border border-[#E6DEC9] text-[#786D58] hover:text-[#1A1513] rounded-xl flex items-center justify-center font-black text-xl active:scale-95 transition-transform shrink-0 cursor-pointer"
                  >
                    -
                  </button>
                  <div className="text-center font-mono py-1">
                    <span className="text-4xl font-black text-[#1A1513]">
                      {quantityInputStr || '0'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const step = pendingUnit === 'kg' ? 0.1 : 1;
                      setQuantityInputStr(prev => {
                        const cur = parseFloat(prev) || 0;
                        const res = cur + step;
                        return pendingUnit === 'kg' ? res.toFixed(1) : Math.round(res).toString();
                      });
                      setIsQuantityModified(true);
                      triggerHaptic(15);
                    }}
                    className="w-11 h-11 bg-white border border-[#E6DEC9] text-[#786D58] hover:text-[#1A1513] rounded-xl flex items-center justify-center font-black text-xl active:scale-95 transition-transform shrink-0 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Micro numeric keyboard inside Quantity Popup */}
                <div className="grid grid-cols-3 gap-2.5 bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E6DEC9]/65">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        triggerHaptic(12);
                        if (!isQuantityModified) {
                          setIsQuantityModified(true);
                          if (k === '⌫') {
                            setQuantityInputStr('0');
                          } else if (k === '.') {
                            setQuantityInputStr('0.');
                          } else {
                            setQuantityInputStr(k);
                          }
                        } else {
                          if (k === '⌫') {
                            setQuantityInputStr(prev => prev.length <= 1 ? '0' : prev.slice(0, -1));
                          } else if (k === '.') {
                            setQuantityInputStr(prev => prev.includes('.') ? prev : (prev || '0') + '.');
                          } else {
                            setQuantityInputStr(prev => prev === '0' ? k : prev + k);
                          }
                        }
                      }}
                      className={`h-11 rounded-xl text-base font-black flex items-center justify-center transition-all cursor-pointer shadow-3xs ${
                        k === '⌫'
                          ? 'bg-[#FFF0F3] text-[#E50014] border border-[#FFC9C9]'
                          : 'bg-white hover:bg-stone-50 text-[#1A1513] border border-[#E6DEC9]/80'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>

                {/* Quick select presets for pieces and weights */}
                <div className="grid grid-cols-6 gap-1.5 justify-center">
                  {[0.5, 0.7, 1, 1.5, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setQuantityInputStr(num.toString());
                        triggerHaptic(20);
                      }}
                      className={`py-2 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                        parseFloat(quantityInputStr) === num
                          ? 'bg-[#E50014] text-white border-transparent font-black shadow-3xs'
                          : 'bg-[#FAF8F5] text-[#786D58] border-[#E6DEC9]/70 hover:bg-stone-50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

              </div>

              {/* Lower confirmation and cancellation controls */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPendingItemToAdd(null);
                    triggerHaptic(10);
                  }}
                  className="flex-1 py-3 bg-[#FAF8F5] border border-[#E6DEC9] text-[#786D58] rounded-xl text-xs font-black uppercase transition-colors hover:bg-stone-50 cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={confirmPendingItemAdd}
                  className="flex-1 py-3 bg-[#E50014] hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase transition-all shadow-xs cursor-pointer"
                >
                  {language === 'ru' ? 'Добавить' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. SECURE VIRTUAL KEYPAD SLIDE-UP ONSCREEN KEYBOARD SHEET */}
      <AnimatePresence>
        {activeInput && (
          <div className="fixed inset-0 bg-[#1A1513]/40 backdrop-blur-2xs z-[80] flex items-center justify-center p-4">
            {/* Click backdrop overlay to close */}
            <div className="absolute inset-0" onClick={() => { setActiveInput(null); triggerHaptic(10); }} />
            
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-[480px] bg-[#FAF9F6] border border-[#E6DEC9] shadow-2xl flex flex-col select-none rounded-[32px] overflow-hidden z-20"
            >
              {/* Top Keyboard Bar for selection display */}
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#E6DEC9]/40 bg-white/70">
                <div className="flex flex-col min-w-0 flex-1 pr-3">
                  <span className="text-[12px] uppercase font-semibold tracking-wider text-[#A19885]">
                    {activeInput.label}
                  </span>
                  <span className="text-base sm:text-lg font-black text-[#1A1513] font-mono tracking-tight truncate">
                    {activeInput.value || '...'}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Language Toggler block under text mode */}
                  {activeInput.type === 'text' && !['itemName', 'editItemName', 'storeName', 'storeNameCart', 'storePopup'].includes(activeInput.id) && (
                    <div className="flex bg-[#F2ECE0] p-0.5 rounded-lg border border-[#E6DEC9]/50">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentKeyboardLang('latin');
                          triggerHaptic(15);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-black uppercase rounded-md transition-all ${
                          currentKeyboardLang === 'latin'
                            ? 'bg-white text-[#1A1513] shadow-xs'
                            : 'text-[#A19885] hover:text-[#786D58]'
                        }`}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentKeyboardLang('cyrillic');
                          triggerHaptic(15);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-black uppercase rounded-md transition-all ${
                          currentKeyboardLang === 'cyrillic'
                            ? 'bg-white text-[#1A1513] shadow-xs'
                            : 'text-[#A19885] hover:text-[#786D58]'
                        }`}
                      >
                        РУ
                      </button>
                    </div>
                  )}

                  {/* Hide / OK keyboard button */}
                  <button
                    type="button"
                    onClick={handleKeyboardOkSubmit}
                    className="bg-[#1A1513] hover:bg-stone-850 text-white px-5 py-2 rounded-lg text-[12px] font-bold uppercase transition-colors cursor-pointer border-none shadow-xs"
                  >
                    OK
                  </button>
                </div>
              </div>

              {/* Main Key Grid Layout */}
              <div className="p-4 bg-[#FDFCF9]/95 space-y-2">
                {activeInput.type === 'numeric' ? (
                  // Numeric key grid layout
                  <div className="grid grid-cols-3 gap-2 py-2 max-w-[320px] mx-auto">
                    {numericKeys.map((row, rIdx) => (
                      <div key={rIdx} className="col-span-3 grid grid-cols-3 gap-2">
                        {row.map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => handleKeyPress(k)}
                            className={`h-14 rounded-xl text-lg font-black flex items-center justify-center transition-all cursor-pointer shadow-3xs border ${
                              k === '⌫'
                                ? 'bg-[#FFF0F3] border-[#FFC9C9] text-[#E50014] hover:bg-[#FFE5EB]'
                                : 'bg-white hover:bg-stone-50 text-[#1A1513] border-[#E6DEC9]/70'
                            }`}
                          >
                            {k}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Alphabet text keys layout
                  <div className="space-y-1.5 py-1">
                    {(currentKeyboardLang === 'latin' ? latinKeys : cyrillicKeys).map((row, rIdx) => (
                      <div key={rIdx} className="flex justify-center gap-1">
                        {row.map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => handleKeyPress(k)}
                            className="flex-1 max-w-[42px] h-[43px] bg-white border border-[#E6DEC9]/80 text-[15px] font-extrabold text-[#1A1513] rounded-md flex items-center justify-center shadow-3xs cursor-pointer hover:bg-stone-50 active:scale-95 transition-transform"
                          >
                            {k}
                          </button>
                        ))}
                      </div>
                    ))}

                    {/* Special bottom control keys block: Shift, Space, Backspace */}
                    <div className="flex justify-center gap-2 max-w-md mx-auto pt-2">
                      {/* Shift button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsShiftActive(!isShiftActive);
                          triggerHaptic(15);
                        }}
                        className={`px-3.5 h-[43px] rounded-md border text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 cursor-pointer select-none ${
                          isShiftActive
                            ? 'bg-[#E50014] border-transparent text-white shadow-3xs'
                            : 'bg-white border-[#E6DEC9]/80 text-[#786D58] hover:bg-stone-50'
                        }`}
                      >
                        ⇧ SHIFT
                      </button>

                      {/* Space bar */}
                      <button
                        type="button"
                        onClick={() => handleKeyPress('Space')}
                        className="flex-1 h-[43px] bg-white border border-[#E6DEC9]/80 text-[10px] font-bold text-[#1A1513] rounded-md flex items-center justify-center shadow-3xs cursor-pointer hover:bg-stone-50 active:scale-95 transition-transform"
                      >
                        SPACE
                      </button>

                      {/* Backspace button */}
                      <button
                        type="button"
                        onClick={() => handleKeyPress('⌫')}
                        className="px-3.5 h-[43px] bg-[#FFF0F3] border border-[#FFC9C9] text-[10px] font-black text-[#E50014] rounded-md flex items-center justify-center shadow-3xs cursor-pointer hover:bg-[#FFE5EB] active:scale-95 transition-transform"
                      >
                        ⌫ DEL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
