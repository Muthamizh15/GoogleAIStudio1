
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  List, 
  PieChart as ChartIcon, 
  Sparkles,
  Search,
  Wallet,
  CalendarCheck,
  Settings,
  Download,
  Upload,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import SmartAddModal from './components/SmartAddModal';
import SubscriptionList from './components/SubscriptionList';
import Analytics from './components/Analytics';
import { Subscription } from './types';
import { getSpendingAdvice } from './services/geminiService';

// Updated key for new data structure
const STORAGE_KEY = 'billtrack_portal_v1';

// Initial dummy data with updated fields
const INITIAL_DATA: Subscription[] = [
  { 
      id: '1', 
      name: 'Netflix', 
      price: 649, 
      currency: 'INR', 
      billingCycle: 'monthly', 
      category: 'Entertainment', 
      startDate: '2023-01-15', 
      active: true, 
      paymentType: 'Credit Card',
      paymentDetails: 'HDFC Regalia •••• 4242',
      notes: 'Family plan shared with brother'
  },
  { 
      id: '2', 
      name: 'HDFC Life Insurance', 
      price: 15000, 
      currency: 'INR', 
      billingCycle: 'yearly', 
      category: 'Insurance', 
      startDate: '2023-03-10', 
      active: true, 
      paymentType: 'Net Banking',
      paymentDetails: 'SBI Savings',
      notes: 'Policy #987654321'
  },
  { 
      id: '3', 
      name: 'Jio Fiber', 
      price: 1178, 
      currency: 'INR', 
      billingCycle: 'monthly', 
      category: 'Utilities', 
      startDate: '2023-05-01', 
      active: true, 
      paymentType: 'UPI',
      paymentDetails: 'gpay',
      notes: ''
  },
];

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Helper for Base64 Encoding with Unicode support
const toBase64 = (str: string) => {
  try {
    return window.btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.error("Encoding failed", e);
    return "";
  }
};

const fromBase64 = (str: string) => {
  try {
    return decodeURIComponent(escape(window.atob(str)));
  } catch (e) {
    console.error("Decoding failed", e);
    return "";
  }
};

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'settings'>('dashboard');
  
  // Robust state initialization with data sanitization
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    if (typeof window === 'undefined') return INITIAL_DATA;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      
      // Critical: Ensure every item has an ID. Old data might miss it.
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(item => ({
            ...item,
            id: item.id || generateId()
        }));
      }
      return INITIAL_DATA;
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      return INITIAL_DATA;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [syncLink, setSyncLink] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [urlImportData, setUrlImportData] = useState<Subscription[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check URL for sync data on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');
    if (dataParam) {
      try {
        const jsonStr = fromBase64(dataParam);
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
            setUrlImportData(parsed);
        }
      } catch (e) {
        console.error("Failed to parse sync link data", e);
      }
    }
  }, []);

  // Persist to local storage whenever subscriptions change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
    } catch (error) {
      console.error('Failed to save subscriptions:', error);
    }
  }, [subscriptions]);

  const handleAddSubscription = (subData: Omit<Subscription, 'id'>) => {
    const newSub: Subscription = {
      ...subData,
      id: generateId(),
    };
    setSubscriptions(prev => [newSub, ...prev]);
  };

  const handleUpdateSubscription = (updatedSub: Subscription) => {
    setSubscriptions(prev => prev.map(s => s.id === updatedSub.id ? updatedSub : s));
    setEditingSubscription(null);
  };

  const handleDeleteSubscription = (id: string) => {
    if (!id) {
        console.error("Attempted to delete item with no ID");
        return;
    }
    console.log("Deleting subscription:", id);
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const handleEditClick = (sub: Subscription) => {
      setEditingSubscription(sub);
      setIsModalOpen(true);
  };

  const handleModalClose = () => {
      setIsModalOpen(false);
      setEditingSubscription(null);
  };

  const handleGetAdvice = async () => {
    setAdviceLoading(true);
    setAdvice(null);
    const result = await getSpendingAdvice(subscriptions);
    setAdvice(result);
    setAdviceLoading(false);
  };

  // --- Data Management ---

  const handleExportData = () => {
    const dataStr = JSON.stringify(subscriptions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `billportal_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (Array.isArray(parsed)) {
            // Basic validation
            const valid = parsed.every(p => p.name && p.price !== undefined);
            if (valid) {
                // Ensure IDs
                const sanitized = parsed.map(item => ({...item, id: item.id || generateId() }));
                setSubscriptions(sanitized);
                alert("Data restored successfully!");
                setActiveTab('dashboard');
            } else {
                alert("Invalid file format. Please use a valid backup file.");
            }
        } else {
             alert("Invalid file structure.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse file.");
      }
    };
    reader.readAsText(file);
    // Reset input
    if (event.target) event.target.value = '';
  };

  const handleGenerateSyncLink = () => {
    const jsonStr = JSON.stringify(subscriptions);
    const encoded = toBase64(jsonStr);
    const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
    
    // Check approximate length limit (2000 chars is safe for most browsers, though modern ones support more)
    if (url.length > 8000) {
        alert("Your data is too large to share via a single link. Please use the 'Backup File' method instead.");
        return;
    }
    
    setSyncLink(url);
    setCopySuccess(false);
  };

  const copyToClipboard = () => {
    if (syncLink) {
        navigator.clipboard.writeText(syncLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const confirmUrlImport = () => {
      if (urlImportData) {
          setSubscriptions(urlImportData);
          setUrlImportData(null);
          // Clear URL
          window.history.replaceState({}, document.title, window.location.pathname);
          alert("Data synced successfully!");
      }
  };

  const cancelUrlImport = () => {
      setUrlImportData(null);
      // Clear URL
      window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleResetData = () => {
      if (confirm("Are you sure? This will delete all local data and reset to defaults.")) {
          setSubscriptions(INITIAL_DATA);
          localStorage.removeItem(STORAGE_KEY);
          alert("App reset to default state.");
      }
  };

  // --- Derived Stats ---
  const totalMonthlySpend = subscriptions.reduce((acc, sub) => {
    if (!sub.active) return acc;
    
    let monthlyCost = 0;
    switch (sub.billingCycle) {
        case 'yearly':
            monthlyCost = sub.price / 12;
            break;
        case 'quarterly':
            monthlyCost = sub.price / 3;
            break;
        case 'half-yearly':
            monthlyCost = sub.price / 6;
            break;
        case 'every-28-days':
            monthlyCost = (sub.price * (365 / 28)) / 12;
            break;
        case 'monthly':
        default:
            monthlyCost = sub.price;
            break;
    }
    
    return acc + monthlyCost;
  }, 0);

  const activeCount = subscriptions.filter(s => s.active).length;

  const filteredSubs = subscriptions.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.notes && s.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex font-inter flex-col md:flex-row">
      
      {/* Import Confirmation Modal */}
      {urlImportData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-800 border border-slate-700 max-w-md w-full rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 text-emerald-400 mb-4">
                    <CheckCircle className="w-8 h-8" />
                    <h3 className="text-xl font-bold text-white">Sync Data Found</h3>
                </div>
                <p className="text-slate-300 mb-6">
                    We found subscription data in your link. Do you want to overwrite your current local data with these <strong>{urlImportData.length} entries</strong>?
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={cancelUrlImport}
                        className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmUrlImport}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-900/20"
                    >
                        Yes, Sync Data
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-800/50">
           <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
             <Wallet className="w-6 h-6 text-indigo-500" />
             BillPortal
           </h1>
           <p className="text-xs text-slate-500 mt-1">Unified Tracker</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600/10 text-indigo-400 font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-indigo-600/10 text-indigo-400 font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
          >
            <ChartIcon className="w-5 h-5" />
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-indigo-600/10 text-indigo-400 font-semibold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
          >
            <Settings className="w-5 h-5" />
            Data & Sync
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800/50">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Total Monthly Liability</p>
                <p className="text-xl font-bold text-white">₹{totalMonthlySpend.toFixed(2)}</p>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-w-0 pb-20 md:pb-0">
        
        {/* Top Header */}
        <header className="h-16 md:h-20 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 lg:px-10">
          <div className="flex items-center gap-2 md:hidden">
             <Wallet className="w-5 h-5 text-indigo-500" />
             <span className="font-bold text-lg text-white">BillPortal</span>
          </div>

          <div className="hidden md:block w-full max-w-md relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
             <input 
                type="text" 
                placeholder="Search bills, insurance, subscriptions..." 
                className="w-full bg-slate-800 border-none rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Mobile Search Icon Trigger (Simplified for now) */}
            <div className="md:hidden">
                {/* Could add a search toggle here */}
            </div>
            
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 md:px-5 md:py-2.5 rounded-full font-medium shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Entry</span>
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 min-h-[calc(100vh-5rem)]">
            
            {/* Tab: Dashboard */}
            {activeTab === 'dashboard' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 md:space-y-8">
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700 p-6 rounded-2xl relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Wallet className="w-24 h-24 text-indigo-400" />
                             </div>
                             <p className="text-slate-400 text-sm font-medium mb-1">Monthly Outflow</p>
                             <h2 className="text-3xl font-bold text-white tracking-tight">₹{totalMonthlySpend.toFixed(2)}</h2>
                             <p className="text-xs text-indigo-400 mt-2 font-medium">Avg. Cost / Day: ₹{(totalMonthlySpend/30).toFixed(0)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700 p-6 rounded-2xl relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <List className="w-24 h-24 text-emerald-400" />
                             </div>
                             <p className="text-slate-400 text-sm font-medium mb-1">Active Entries</p>
                             <h2 className="text-3xl font-bold text-white tracking-tight">{activeCount}</h2>
                             <p className="text-xs text-emerald-400 mt-2 font-medium">Bills, Subs & EMIs</p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700 p-6 rounded-2xl relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <CalendarCheck className="w-24 h-24 text-amber-400" />
                             </div>
                             <p className="text-slate-400 text-sm font-medium mb-1">Yearly Liability</p>
                             <h2 className="text-3xl font-bold text-white tracking-tight">₹{(totalMonthlySpend * 12).toFixed(2)}</h2>
                             <p className="text-xs text-amber-400 mt-2 font-medium">Total projected cost</p>
                        </div>
                    </div>

                    {/* AI Advisor Section */}
                    <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="flex items-start justify-between">
                            <div className="space-y-4 max-w-3xl relative z-10">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-400" />
                                    Smart Insights
                                </h3>
                                
                                {!advice && !adviceLoading && (
                                    <div className="flex flex-col items-start gap-4">
                                        <p className="text-slate-300 text-sm leading-relaxed">
                                            Get AI-powered optimization tips for your bills, insurance, and subscriptions.
                                        </p>
                                        <button 
                                            onClick={handleGetAdvice}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Analyze Finances
                                        </button>
                                    </div>
                                )}
                                
                                {adviceLoading && (
                                    <div className="flex items-center gap-3 text-slate-300">
                                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm animate-pulse">Analyzing financial data...</span>
                                    </div>
                                )}

                                {advice && (
                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                        <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                                            {advice}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* List Section */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Your Bills & Subscriptions</h2>
                            <div className="text-sm text-slate-400">{filteredSubs.length} entries</div>
                        </div>
                        {/* Mobile Search (Duplicate for better UX if needed, or kept in header) */}
                        <div className="mb-4 md:hidden">
                             <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    className="w-full bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                             </div>
                        </div>
                        
                        <SubscriptionList 
                            subscriptions={filteredSubs} 
                            onDelete={handleDeleteSubscription}
                            onEdit={handleEditClick}
                        />
                    </div>
                </div>
            )}

            {/* Tab: Analytics */}
            {activeTab === 'analytics' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <h2 className="text-2xl font-bold text-white mb-8">Financial Overview</h2>
                     <Analytics subscriptions={subscriptions} />
                </div>
            )}

            {/* Tab: Settings */}
            {activeTab === 'settings' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                     <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Data & Synchronization</h2>
                        <p className="text-slate-400 max-w-2xl text-sm">
                            This is a secure, private app. Your data lives on this device. 
                            To view your data on another device, use the <strong>Sync via Link</strong> or <strong>Backup</strong> options below.
                        </p>
                     </div>

                     {/* Sync Via Link Section */}
                     <div className="bg-indigo-900/10 border border-indigo-500/20 p-6 rounded-2xl">
                         <div className="flex items-start gap-4">
                             <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 shrink-0">
                                 <LinkIcon className="w-6 h-6" />
                             </div>
                             <div className="space-y-4 w-full">
                                 <div>
                                     <h3 className="text-lg font-semibold text-white">Sync via Link (Easiest)</h3>
                                     <p className="text-sm text-slate-400 mt-1">
                                         Create a magic link containing all your data. Send it to your other device (email/WhatsApp) and open it to instantly sync.
                                     </p>
                                 </div>
                                 
                                 {!syncLink ? (
                                    <button 
                                        onClick={handleGenerateSyncLink}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-indigo-900/20"
                                    >
                                        Generate Sync Link
                                    </button>
                                 ) : (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input 
                                                readOnly 
                                                value={syncLink} 
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-400 text-xs font-mono truncate"
                                            />
                                            <button 
                                                onClick={copyToClipboard}
                                                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                                                title="Copy to clipboard"
                                            >
                                                {copySuccess ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                            <button 
                                                onClick={() => setSyncLink(null)}
                                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-indigo-300">
                                            Link generated! Copy and open this URL on your other device.
                                        </p>
                                    </div>
                                 )}
                             </div>
                         </div>
                     </div>

                     <h3 className="text-lg font-semibold text-white pt-4">Manual Backup</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Export */}
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center text-center space-y-4 hover:border-indigo-500/50 transition-colors">
                            <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center text-slate-400">
                                <Download className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-medium text-white">Download File</h3>
                                <p className="text-xs text-slate-500 mt-1">Save JSON file to device.</p>
                            </div>
                            <button 
                                onClick={handleExportData}
                                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Download
                            </button>
                        </div>

                        {/* Import */}
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center text-center space-y-4 hover:border-emerald-500/50 transition-colors">
                            <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center text-slate-400">
                                <Upload className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-medium text-white">Upload File</h3>
                                <p className="text-xs text-slate-500 mt-1">Restore from JSON file.</p>
                            </div>
                            <button 
                                onClick={handleImportTrigger}
                                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Select File
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImportFile} 
                                accept=".json" 
                                className="hidden" 
                            />
                        </div>

                        {/* Reset */}
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center text-center space-y-4 hover:border-red-500/50 transition-colors">
                            <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center text-slate-400">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-medium text-white">Factory Reset</h3>
                                <p className="text-xs text-slate-500 mt-1">Clear all local data.</p>
                            </div>
                            <button 
                                onClick={handleResetData}
                                className="w-full py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-lg text-sm font-medium transition-all"
                            >
                                Reset App
                            </button>
                        </div>
                     </div>
                </div>
            )}

        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-30 md:hidden pb-safe">
        <div className="flex justify-around items-center h-16">
            <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-500'}`}
            >
                <LayoutDashboard className="w-6 h-6" />
                <span className="text-[10px] font-medium">Dashboard</span>
            </button>
            <button 
                onClick={() => setActiveTab('analytics')}
                className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'analytics' ? 'text-indigo-400' : 'text-slate-500'}`}
            >
                <ChartIcon className="w-6 h-6" />
                <span className="text-[10px] font-medium">Analytics</span>
            </button>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'settings' ? 'text-indigo-400' : 'text-slate-500'}`}
            >
                <Settings className="w-6 h-6" />
                <span className="text-[10px] font-medium">Settings</span>
            </button>
        </div>
      </nav>

      <SmartAddModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        onAdd={handleAddSubscription}
        onUpdate={handleUpdateSubscription}
        initialData={editingSubscription}
      />

    </div>
  );
}

export default App;
