
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  List, 
  PieChart as ChartIcon, 
  Sparkles,
  Search,
  Wallet,
  CalendarCheck
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');
  
  // Robust state initialization
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    if (typeof window === 'undefined') return INITIAL_DATA;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_DATA;
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
    if(window.confirm("Are you sure you want to delete this entry?")) {
        setSubscriptions(prev => prev.filter(s => s.id !== id));
    }
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

  // Derived Stats
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex font-inter">
      
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
        </nav>

        <div className="p-4 border-t border-slate-800/50">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Total Monthly Liability</p>
                <p className="text-xl font-bold text-white">₹{totalMonthlySpend.toFixed(2)}</p>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-w-0">
        
        {/* Top Header */}
        <header className="h-20 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4 md:hidden">
             <span className="font-bold text-lg text-indigo-400">BillPortal</span>
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

          <div className="flex items-center gap-4 ml-auto">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full font-medium shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Entry</span>
            </button>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
            
            {/* Tab: Dashboard */}
            {activeTab === 'dashboard' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        </div>
      </main>

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
