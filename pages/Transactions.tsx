import React, { useState, useRef, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Transaction, TransactionType, Category } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';
import { Plus, Trash2, Camera, Loader2, Search, Filter, Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank, FileText, FileSpreadsheet, Download, X } from 'lucide-react';
import { analyzeReceiptImage, suggestCategory } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Transactions: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Partial<Transaction>>({
    type: 'expense',
    amount: 0,
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  // --- Monthly Navigation Logic ---
  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // --- Filtering & Sorting Logic ---
  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      
      // 1. Filter by Month/Year
      const isSameMonth = 
        tDate.getMonth() === currentDate.getMonth() && 
        tDate.getFullYear() === currentDate.getFullYear();

      if (!isSameMonth) return false;

      // 2. Filter by Search Term
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        const noteMatch = (t.note || '').toLowerCase().includes(term);
        const catMatch = (t.category || '').toLowerCase().includes(term);
        const amountMatch = t.amount?.toString().includes(term);
        return noteMatch || catMatch || amountMatch;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentDate, searchTerm]);

  // --- Monthly Stats Calculation ---
  const monthlyStats = useMemo(() => {
    const income = filteredData.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = filteredData.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return {
      income,
      expense,
      savings: income - expense
    };
  }, [filteredData]);

  // --- Export Logic ---
  const exportCSV = () => {
    if (filteredData.length === 0) {
        alert("No transactions to export for this period.");
        return;
    }
    const headers = ['Date', 'Type', 'Category', 'Note', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(t => [
        `"${new Date(t.date).toLocaleDateString()}"`,
        t.type,
        t.category,
        `"${(t.note || '').replace(/"/g, '""')}"`,
        t.amount
      ].join(','))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SmartSpend_Report_${formatMonthYear(currentDate).replace(' ', '_')}.csv`;
    link.click();
  };

  const exportPDF = () => {
    if (filteredData.length === 0) {
        alert("No transactions to export for this period.");
        return;
    }
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text("SmartSpend Financial Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Period: ${formatMonthYear(currentDate)}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35);
    
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 40, 180, 25, 3, 3, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Total Income", 24, 50);
    doc.text("Total Expense", 84, 50);
    doc.text("Net Savings", 144, 50);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(`$${monthlyStats.income.toFixed(2)}`, 24, 58);
    doc.setTextColor(239, 68, 68);
    doc.text(`$${monthlyStats.expense.toFixed(2)}`, 84, 58);
    const savingsColor = monthlyStats.savings >= 0 ? [79, 70, 229] : [245, 158, 11];
    doc.setTextColor(savingsColor[0], savingsColor[1], savingsColor[2]);
    doc.text(`$${monthlyStats.savings.toFixed(2)}`, 144, 58);

    const tableColumn = ["Date", "Type", "Category", "Description", "Amount"];
    const tableRows = filteredData.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type.toUpperCase(),
      t.category,
      t.note || '',
      `$${t.amount.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      headStyles: { fillColor: [79, 70, 229], fontSize: 10, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`SmartSpend_Report_${formatMonthYear(currentDate).replace(' ', '_')}.pdf`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value
    }));
  };

  const handleNoteBlur = async () => {
    if (form.note && form.amount && form.category === 'Food') {
        const suggested = await suggestCategory(form.note, form.amount || 0);
        if (suggested && EXPENSE_CATEGORIES.includes(suggested as Category)) {
            setForm(prev => ({ ...prev, category: suggested as Category }));
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const newTransaction: Transaction = {
      id: Date.now().toString(), 
      amount: form.amount || 0,
      category: form.category as Category,
      date: new Date(form.date!).toISOString(),
      note: form.note || '',
      type: form.type as TransactionType,
      receiptUrl: form.receiptUrl
    };
    const success = await addTransaction(newTransaction);
    setIsSaving(false);
    if (success) {
      setIsModalOpen(false);
      setForm({ type: 'expense', amount: 0, category: 'Food', date: new Date().toISOString().split('T')[0], note: '' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      const result = await analyzeReceiptImage(base64Data);
      if (result) {
        setForm(prev => ({
          ...prev,
          amount: result.amount,
          date: result.date || new Date().toISOString().split('T')[0],
          note: result.note,
          category: result.category as Category || 'Custom',
          receiptUrl: base64String
        }));
      }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Transactions</h2>
          <p className="text-slate-500 mt-1">History and records.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <button onClick={exportCSV} className="flex-1 lg:flex-none justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center shadow-sm transition-all font-medium">
                <FileSpreadsheet className="w-5 h-5 mr-2 text-emerald-600" />
                <span>Excel</span>
            </button>
            <button onClick={exportPDF} className="flex-1 lg:flex-none justify-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center shadow-sm transition-all font-medium">
                <FileText className="w-5 h-5 mr-2 text-rose-600" />
                <span>PDF</span>
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex-1 lg:flex-none justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center shadow-lg shadow-indigo-600/20 transition-all active:scale-95 font-medium">
                <Plus className="w-5 h-5 mr-2" />
                Add New
            </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center bg-slate-50 rounded-xl p-1 w-full md:w-auto">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-indigo-600"><ChevronLeft className="w-5 h-5" /></button>
          <div className="px-6 font-bold text-slate-700 w-40 text-center select-none">{formatMonthYear(currentDate)}</div>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-indigo-600"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="flex gap-6 w-full md:w-auto justify-around md:justify-end">
           <div className="text-center md:text-right">
             <span className="text-xs text-slate-400 font-semibold uppercase block">Income</span>
             <span className="text-emerald-600 font-bold flex items-center justify-center md:justify-end gap-1"><TrendingUp className="w-3 h-3" /> ${monthlyStats.income.toFixed(0)}</span>
           </div>
           <div className="w-px bg-slate-100 h-10 hidden md:block"></div>
           <div className="text-center md:text-right">
             <span className="text-xs text-slate-400 font-semibold uppercase block">Expense</span>
             <span className="text-rose-600 font-bold flex items-center justify-center md:justify-end gap-1"><TrendingDown className="w-3 h-3" /> ${monthlyStats.expense.toFixed(0)}</span>
           </div>
           <div className="w-px bg-slate-100 h-10 hidden md:block"></div>
           <div className="text-center md:text-right">
             <span className="text-xs text-slate-400 font-semibold uppercase block">Savings</span>
             <span className={`font-bold flex items-center justify-center md:justify-end gap-1 ${monthlyStats.savings >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}><PiggyBank className="w-3 h-3" /> ${monthlyStats.savings.toFixed(0)}</span>
           </div>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-none bg-transparent" title="" action={null}>
        <div className="flex gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search note, category, amount..." 
                    className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
            </div>
            <button className="hidden sm:flex items-center px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium">
                <Filter className="w-4 h-4 mr-2" />
                Filter
            </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="p-5 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="p-5 text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                  <th className="p-5 text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
                  <th className="p-5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                  <th className="p-5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map(t => (
                  <tr key={t.id} className="group hover:bg-slate-50 transition-colors duration-150">
                    <td className="p-5">
                       <div className="flex items-center text-slate-600 font-medium"><Calendar className="w-4 h-4 mr-2 text-slate-400" />{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${t.type === 'income' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{t.category}</span>
                    </td>
                    <td className="p-5 text-sm text-slate-700 font-medium">{t.note}</td>
                    <td className="p-5 text-right">
                        <span className={`font-bold text-base ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>{t.type === 'income' ? '+' : '-'} ${t.amount.toFixed(2)}</span>
                    </td>
                    <td className="p-5 text-center">
                      <button onClick={() => deleteTransaction(t.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="p-12 text-center text-slate-400 bg-slate-50/30">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><Search className="w-8 h-8 text-slate-300" /></div>
                <h3 className="text-slate-900 font-medium">No transactions found</h3>
                <p className="text-sm mt-1">Try adjusting your filters or current view.</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Transaction">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isScanning || isSaving} className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex flex-col items-center justify-center gap-2 group">
              {isScanning ? (
                <><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /><span className="font-medium">Analyzing Receipt...</span></>
              ) : (
                <><div className="p-3 bg-indigo-100 text-indigo-600 rounded-full group-hover:scale-110 transition-transform"><Camera className="w-6 h-6" /></div><div className="text-center"><span className="font-bold block">Scan Receipt with AI</span><span className="text-xs text-indigo-400">Auto-fill details from image</span></div></>
              )}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>

          <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 rounded-xl">
            <label className="cursor-pointer">
              <input type="radio" name="type" value="expense" checked={form.type === 'expense'} onChange={handleInputChange} className="hidden peer" />
              <div className="text-center py-2.5 rounded-lg text-sm font-semibold text-slate-500 peer-checked:bg-white peer-checked:text-rose-600 peer-checked:shadow-sm transition-all">Expense</div>
            </label>
            <label className="cursor-pointer">
              <input type="radio" name="type" value="income" checked={form.type === 'income'} onChange={handleInputChange} className="hidden peer" />
              <div className="text-center py-2.5 rounded-lg text-sm font-semibold text-slate-500 peer-checked:bg-white peer-checked:text-emerald-600 peer-checked:shadow-sm transition-all">Income</div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Amount</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input type="number" name="amount" value={form.amount} onChange={handleInputChange} className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-lg text-slate-900" required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Date</label>
                    <input type="date" name="date" value={form.date} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-700 font-medium" required />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Category</label>
                    <select name="category" value={form.category} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-700 font-medium appearance-none">
                        {(form.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Note</label>
                <input type="text" name="note" value={form.note} onChange={handleInputChange} onBlur={handleNoteBlur} placeholder="e.g. Weekly Grocery Run" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-700 font-medium" />
            </div>
          </div>
          <button type="submit" disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] mt-4 flex justify-center items-center disabled:opacity-70">
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Transaction"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Transactions;