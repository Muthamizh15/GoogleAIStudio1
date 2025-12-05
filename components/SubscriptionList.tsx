
import React from 'react';
import { Trash2, Edit2, Calendar, CreditCard, StickyNote } from 'lucide-react';
import { Subscription } from '../types';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onDelete: (id: string) => void;
  onEdit: (sub: Subscription) => void;
}

const SubscriptionList: React.FC<SubscriptionListProps> = ({ subscriptions, onDelete, onEdit }) => {
  
  const getNextDueDate = (sub: Subscription): string => {
    const start = new Date(sub.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let next = new Date(start);
    next.setHours(0, 0, 0, 0);

    if (next > today) {
        return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    while (next < today) {
        switch (sub.billingCycle) {
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                break;
            case 'yearly':
                next.setFullYear(next.getFullYear() + 1);
                break;
            case 'quarterly':
                next.setMonth(next.getMonth() + 3);
                break;
            case 'half-yearly':
                next.setMonth(next.getMonth() + 6);
                break;
            case 'every-28-days':
                next.setDate(next.getDate() + 28);
                break;
            default:
                next.setMonth(next.getMonth() + 1);
        }
    }
    
    const dateStr = next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return dateStr;
  };

  const isDueSoon = (sub: Subscription): boolean => {
    const start = new Date(sub.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let next = new Date(start);
    next.setHours(0, 0, 0, 0);

    if (next < today) {
        while (next < today) {
            switch (sub.billingCycle) {
                case 'monthly':
                    next.setMonth(next.getMonth() + 1);
                    break;
                case 'yearly':
                    next.setFullYear(next.getFullYear() + 1);
                    break;
                case 'quarterly':
                    next.setMonth(next.getMonth() + 3);
                    break;
                case 'half-yearly':
                    next.setMonth(next.getMonth() + 6);
                    break;
                case 'every-28-days':
                    next.setDate(next.getDate() + 28);
                    break;
                default:
                    next.setMonth(next.getMonth() + 1);
            }
        }
    }
    
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const getCycleLabel = (cycle: string) => {
    switch(cycle) {
        case 'monthly': return '/mo';
        case 'yearly': return '/yr';
        case 'quarterly': return '/qtr';
        case 'half-yearly': return '/6mo';
        case 'every-28-days': return '/28d';
        default: return '';
    }
  };

  if (subscriptions.length === 0) {
    return (
        <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700/50 border-dashed">
            <h3 className="text-slate-400 text-lg font-medium">No active entries</h3>
            <p className="text-slate-500 text-sm mt-2">Add your bills, subscriptions, or insurance to get started.</p>
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
                        <div className="text-xs text-slate-400 font-medium">{getCycleLabel(sub.billingCycle)}</div>
                    </div>
                </div>

                <div className="space-y-3 mt-4 pt-4 border-t border-slate-700/50">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span>Due Date</span>
                        </div>
                        <span className={`${dueSoon ? 'text-amber-400 font-bold' : 'text-slate-200'}`}>
                            {getNextDueDate(sub)}
                        </span>
                    </div>

                    {(sub.paymentType || sub.paymentDetails) && (
                        <div className="flex items-start justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                                <CreditCard className="w-4 h-4" />
                                <span>Payment</span>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                {sub.paymentType && <span className="text-slate-200">{sub.paymentType}</span>}
                                {sub.paymentDetails && <span className="text-slate-500 text-xs truncate max-w-[150px]">{sub.paymentDetails}</span>}
                            </div>
                        </div>
                    )}
                    
                    {sub.notes && (
                        <div className="flex items-start justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                                <StickyNote className="w-4 h-4" />
                                <span>Note</span>
                            </div>
                             <span className="text-slate-400 italic text-xs text-right truncate max-w-[180px]" title={sub.notes}>
                                {sub.notes}
                            </span>
                        </div>
                    )}
                </div>

                <div className="absolute top-4 right-4 flex gap-2 z-10">
                     <button 
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEdit(sub);
                        }}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors shadow-lg cursor-pointer"
                        title="Edit"
                     >
                         <Edit2 className="w-4 h-4"/>
                     </button>
                </div>

                <div className="mt-4 flex justify-between items-center transition-opacity z-10">
                    <span className="text-xs text-slate-600">Started {new Date(sub.startDate).toLocaleDateString()}</span>
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete(sub.id);
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors cursor-pointer"
                        title="Delete"
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
