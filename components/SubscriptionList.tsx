import React from 'react';
import { Trash2, ExternalLink, Calendar, CreditCard } from 'lucide-react';
import { Subscription } from '../types';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onDelete: (id: string) => void;
}

const SubscriptionList: React.FC<SubscriptionListProps> = ({ subscriptions, onDelete }) => {
  
  const getNextDueDate = (sub: Subscription): string => {
    const start = new Date(sub.startDate);
    const today = new Date();
    let next = new Date(start);

    while (next < today) {
        if (sub.billingCycle === 'monthly') {
            next.setMonth(next.getMonth() + 1);
        } else {
            next.setFullYear(next.getFullYear() + 1);
        }
    }
    
    // Check if it's due soon (within 7 days)
    const diffTime = Math.abs(next.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    const dateStr = next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return dateStr;
  };

  const isDueSoon = (sub: Subscription): boolean => {
    const start = new Date(sub.startDate);
    const today = new Date();
    let next = new Date(start);
    while (next < today) {
        if (sub.billingCycle === 'monthly') {
            next.setMonth(next.getMonth() + 1);
        } else {
            next.setFullYear(next.getFullYear() + 1);
        }
    }
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  if (subscriptions.length === 0) {
    return (
        <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700/50 border-dashed">
            <h3 className="text-slate-400 text-lg font-medium">No subscriptions yet</h3>
            <p className="text-slate-500 text-sm mt-2">Use the "Add Subscription" button to get started.</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {subscriptions.map((sub) => {
        const dueSoon = isDueSoon(sub);
        
        return (
            <div 
                key={sub.id} 
                className={`group relative bg-slate-800 rounded-2xl p-6 border transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 ${dueSoon ? 'border-amber-500/50 shadow-amber-900/20' : 'border-slate-700 hover:border-indigo-500/50'}`}
            >
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className="inline-block px-2 py-1 rounded-md bg-slate-700/50 text-slate-300 text-[10px] font-semibold tracking-wider uppercase mb-2">
                            {sub.category}
                        </span>
                        <h3 className="text-xl font-bold text-white tracking-tight">{sub.name}</h3>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-white">
                            {sub.currency === 'INR' ? '₹' : sub.currency === 'USD' ? '$' : sub.currency + ' '}
                            {sub.price.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">/{sub.billingCycle.slice(0, 2)}</div>
                    </div>
                </div>

                <div className="space-y-3 mt-6">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span>Next Payment</span>
                        </div>
                        <span className={`${dueSoon ? 'text-amber-400 font-bold' : 'text-slate-200'}`}>
                            {getNextDueDate(sub)}
                        </span>
                    </div>

                    {sub.paymentMethod && (
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-400">
                                <CreditCard className="w-4 h-4" />
                                <span>Method</span>
                            </div>
                            <span className="text-slate-300 truncate max-w-[120px]">{sub.paymentMethod}</span>
                        </div>
                    )}
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                     {/* Placeholder for edit action */}
                     {/* <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"><Edit2 className="w-4 h-4"/></button> */}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-slate-500">Started {new Date(sub.startDate).toLocaleDateString()}</span>
                    <button 
                        onClick={() => onDelete(sub.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Remove subscription"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
      })}
    </div>
  );
};

export default SubscriptionList;