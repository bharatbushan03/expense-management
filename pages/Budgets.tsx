import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { Card } from '../components/ui/Card';
import { EXPENSE_CATEGORIES } from '../constants';
import { AlertCircle, CheckCircle, Edit3 } from 'lucide-react';

const Budgets: React.FC = () => {
  const { transactions, budgets, updateBudget } = useTransactions();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState<number>(0);

  const calculateSpent = (category: string) => {
    return transactions
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((acc, t) => acc + t.amount, 0);
  };

  const handleEditClick = (category: string, currentLimit: number) => {
    setEditingCategory(category);
    setTempLimit(currentLimit);
  };

  const handleSave = (category: string) => {
    updateBudget(category, tempLimit);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Budgets</h2>
        <p className="text-slate-500 mt-1">Set limits and track your monthly spending goals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXPENSE_CATEGORIES.map(category => {
          const budget = budgets.find(b => b.category === category);
          const limit = budget ? budget.limit : 0;
          const spent = calculateSpent(category);
          const percentage = limit > 0 ? (spent / limit) * 100 : 0;
          const isOverBudget = spent > limit && limit > 0;
          const remaining = Math.max(0, limit - spent);

          let barColor = 'bg-indigo-500';
          if(percentage > 75) barColor = 'bg-amber-500';
          if(percentage > 100) barColor = 'bg-rose-500';

          return (
            <div key={category} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-transform duration-300">
               
               <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isOverBudget ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {isOverBudget ? <AlertCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">{category}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                            {isOverBudget ? 'Exceeded Limit' : `${percentage.toFixed(0)}% Used`}
                        </p>
                    </div>
                 </div>
                 
                 <button 
                    onClick={() => handleEditClick(category, limit)}
                    className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                 >
                    <Edit3 className="w-4 h-4" />
                 </button>
               </div>

               <div className="space-y-4">
                 <div className="flex justify-between items-end">
                   <div>
                       <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Spent</p>
                       <p className={`text-2xl font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>
                         ₹{spent.toLocaleString('en-IN')}
                       </p>
                   </div>
                   <div className="text-right">
                       <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Limit</p>
                       {editingCategory === category ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              value={tempLimit} 
                              onChange={(e) => setTempLimit(parseFloat(e.target.value))}
                              className="w-20 p-1 bg-slate-50 border border-slate-200 rounded text-right font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              autoFocus
                            />
                            <button onClick={() => handleSave(category)} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">OK</button>
                          </div>
                        ) : (
                           <p className="text-xl font-semibold text-slate-600">₹{limit.toLocaleString('en-IN')}</p>
                        )}
                   </div>
                 </div>
                 
                 {/* Progress Bar */}
                 <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1">
                   <div 
                     className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${barColor}`}
                     style={{ width: `${Math.min(percentage, 100)}%` }}
                   />
                 </div>
                 
                 <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">0%</span>
                    <span className={`${remaining < 100 && remaining > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {remaining > 0 ? `₹${remaining.toLocaleString('en-IN')} remaining` : 'No budget left'}
                    </span>
                 </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Budgets;