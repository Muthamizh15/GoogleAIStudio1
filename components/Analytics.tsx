import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Subscription, CATEGORIES } from '../types';

interface AnalyticsProps {
  subscriptions: Subscription[];
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const Analytics: React.FC<AnalyticsProps> = ({ subscriptions }) => {
  const data = useMemo(() => {
    // Calculate monthly equivalent for all
    const categoryTotals = CATEGORIES.reduce((acc, cat) => {
      acc[cat] = 0;
      return acc;
    }, {} as Record<string, number>);

    subscriptions.filter(s => s.active).forEach(sub => {
      let monthlyCost = sub.price;
      
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
          // (Price / 28) * (365/12) roughly, or Total Annual Cost / 12
          // 365 / 28 = ~13.03 cycles per year
          monthlyCost = (sub.price * (365 / 28)) / 12;
          break;
        case 'monthly':
        default:
          monthlyCost = sub.price;
          break;
      }

      if (categoryTotals[sub.category] !== undefined) {
        categoryTotals[sub.category] += monthlyCost;
      } else {
        categoryTotals['Other'] += monthlyCost;
      }
    });

    return Object.keys(categoryTotals)
      .map(cat => ({ name: cat, value: categoryTotals[cat] }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [subscriptions]);

  const totalMonthly = data.reduce((sum, item) => sum + item.value, 0);

  // Projection Data
  const projectionData = useMemo(() => {
    return [
      { name: 'Monthly', cost: totalMonthly },
      { name: 'Yearly', cost: totalMonthly * 12 },
      { name: '5 Years', cost: totalMonthly * 12 * 5 },
    ];
  }, [totalMonthly]);

  if (subscriptions.length === 0) {
     return (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-xl bg-slate-800/30">
            <p>Add subscriptions to see analytics</p>
        </div>
     )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Spend by Category */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-6">Monthly Spend by Category</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                itemStyle={{ color: '#f8fafc' }}
                formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Monthly']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {data.slice(0, 4).map((item, idx) => (
             <div key={item.name} className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length]}}></div>
                <span className="truncate">{item.name}</span>
                <span className="ml-auto font-mono text-slate-400">₹{item.value.toFixed(0)}</span>
             </div>
          ))}
        </div>
      </div>

      {/* Projection */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-6">Cost Projection</h3>
        <div className="flex-1 min-h-[200px]">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={projectionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                <Tooltip 
                   cursor={{fill: '#334155', opacity: 0.4}}
                   contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                   formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Cost']}
                />
                <Bar dataKey="cost" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={32} />
             </BarChart>
           </ResponsiveContainer>
        </div>
        <div className="mt-4 p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-xl">
            <p className="text-indigo-300 text-sm font-medium">
                You are spending approximately <span className="text-white text-lg font-bold">₹{(totalMonthly * 12).toFixed(2)}</span> per year.
            </p>
        </div>
      </div>

    </div>
  );
};

export default Analytics;