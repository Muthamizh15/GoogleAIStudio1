
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
  RefreshCw,
  AlertTriangle
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                     <h2 className="text-2xl font-bold text-white mb-2">Data & Synchronization</h2>
                     <p className="text-slate-400 max-w-2xl">
                        Your data is stored locally on this device. To move your data to another device (e.g. from laptop to phone), 
                        download a backup here and upload it on the other device.
                     </p>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        {/* Export */}
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center text-center space-y-4 hover:border-indigo-500/50 transition-colors">
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
                                <Download className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Backup Data</h3>
                                <p className="text-sm text-slate-500 mt-1">Download your data as a JSON file.</p>
                            </div>
                            <button 
                                onClick={handleExportData}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                            >
                                Download Backup
                            </button>
                        </div>

                        {/* Import */}
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center text-center space-y-4 hover:border-emerald-500/50 transition-colors">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400">
                                <Upload className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Restore Data</h3>
                                <p className="text-sm text-slate-500 mt-1">Upload a backup file to restore entries.</p>
                            </div>
                            <button 
                                onClick={handleImportTrigger}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                            >
                                Upload Backup
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
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-400">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Reset App</h3>
                                <p className="text-sm text-slate-500 mt-1">Clear all data and start fresh.</p>
                            </div>
                            <button 
                                onClick={handleResetData}
                                className="w-full py-2 bg-red-600/20 hover:bg-red-600 hover:text-white text-red-400 border border-red-600/30 rounded-lg font-medium transition-all"
                            >
                                Clear Data
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
