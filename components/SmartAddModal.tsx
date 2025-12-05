import React, { useState } from 'react';
import { X, Sparkles, Loader2, Check } from 'lucide-react';
import { parseSubscriptionInput } from '../services/geminiService';
import { Subscription, CATEGORIES, BillingCycle, CURRENCIES } from '../types';

interface SmartAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (sub: Omit<Subscription, 'id'>) => void;
}

const SmartAddModal: React.FC<SmartAddModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [mode, setMode] = useState<'smart' | 'manual'>('smart');
  const [smartInput, setSmartInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Subscription>>({
    name: '',
    price: 0,
    currency: 'INR',
    billingCycle: 'monthly',
    category: 'Other',
    startDate: new Date().toISOString().split('T')[0],
    active: true,
  });

  const handleSmartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const parsed = await parseSubscriptionInput(smartInput);
      setFormData((prev) => ({ 
        ...prev, 
        ...parsed,
        currency: parsed.currency || prev.currency || 'INR' // Ensure currency is preserved
      }));
      setMode('manual'); // Switch to manual for review
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price === undefined || formData.price === null || isNaN(formData.price)) {
      setError("Name and valid Price are required.");
      return;
    }
    
    onAdd({
      name: formData.name || 'Unknown',
      price: Number(formData.price),
      currency: formData.currency || 'INR',
      billingCycle: (formData.billingCycle as BillingCycle) || 'monthly',
      category: formData.category || 'Other',
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      description: formData.description || '',
      paymentMethod: formData.paymentMethod || '',
      active: true,
    });
    
    // Reset
    setSmartInput('');
    setFormData({
      name: '',
      price: 0,
      currency: 'INR',
      billingCycle: 'monthly',
      category: 'Other',
      startDate: new Date().toISOString().split('T')[0],
      active: true,
    });
    setMode('smart');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-900/50 p-4 flex justify-between items-center border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            {mode === 'smart' ? <Sparkles className="w-5 h-5 text-indigo-400" /> : <div className="w-5 h-5 rounded-full bg-indigo-500" />}
            {mode === 'smart' ? 'AI Quick Add' : 'Review & Save'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'smart' ? (
            <div className="space-y-4">
              <p className="text-slate-300 text-sm">
                Describe your subscription naturally. For example: <br />
                <span className="text-indigo-300 italic">"Jio prepaid plan for ₹749 every 84 days started yesterday"</span>
              </p>
              
              <form onSubmit={handleSmartSubmit} className="space-y-4">
                <textarea
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none h-32"
                  placeholder="Paste receipt text or type details..."
                  value={smartInput}
                  onChange={(e) => setSmartInput(e.target.value)}
                />
                
                {error && <p className="text-red-400 text-sm">{error}</p>}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('manual')}
                    className="flex-1 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium"
                  >
                    Skip to Manual
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !smartInput.trim()}
                    className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loading ? 'Processing...' : 'Analyze'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Category</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-medium text-slate-400">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.price === 0 ? '' : formData.price}
                    onChange={e => setFormData({...formData, price: e.target.valueAsNumber})}
                  />
                </div>
                <div className="space-y-1 col-span-1">
                   <label className="text-xs font-medium text-slate-400">Currency</label>
                   <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                    value={formData.currency}
                    onChange={e => setFormData({...formData, currency: e.target.value})}
                  >
                    {CURRENCIES.map(curr => <option key={curr} value={curr}>{curr}</option>)}
                  </select>
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-medium text-slate-400">Cycle</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.billingCycle}
                    onChange={e => setFormData({...formData, billingCycle: e.target.value as BillingCycle})}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half-yearly">Half-Yearly</option>
                    <option value="every-28-days">Every 28 Days</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Start Date</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
              </div>

              <div className="flex gap-3 pt-2">
                 <button
                    type="button"
                    onClick={() => setMode('smart')}
                    className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Save Subscription
                  </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartAddModal;