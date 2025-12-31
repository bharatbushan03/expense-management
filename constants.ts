import { Category, Transaction, Budget } from './types';
import { LayoutDashboard, Wallet, PieChart, Sparkles, Settings } from 'lucide-react';

export const EXPENSE_CATEGORIES: Category[] = ['Food', 'Travel', 'Rent', 'Bills', 'Shopping', 'Custom'];
export const INCOME_CATEGORIES: Category[] = ['Salary', 'Investment', 'Freelance', 'Custom'];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', amount: 2500, category: 'Salary', date: new Date(new Date().setDate(1)).toISOString(), note: 'Monthly Salary', type: 'income' },
  { id: '2', amount: 1200, category: 'Rent', date: new Date(new Date().setDate(3)).toISOString(), note: 'Apartment Rent', type: 'expense' },
  { id: '3', amount: 85, category: 'Food', date: new Date(new Date().setDate(5)).toISOString(), note: 'Grocery Run', type: 'expense' },
  { id: '4', amount: 45, category: 'Travel', date: new Date(new Date().setDate(6)).toISOString(), note: 'Uber', type: 'expense' },
  { id: '5', amount: 120, category: 'Bills', date: new Date(new Date().setDate(10)).toISOString(), note: 'Electricity', type: 'expense' },
];

export const INITIAL_BUDGETS: Budget[] = [
  { category: 'Food', limit: 500 },
  { category: 'Travel', limit: 200 },
  { category: 'Shopping', limit: 300 },
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Wallet },
  { id: 'budgets', label: 'Budgets', icon: PieChart },
  { id: 'insights', label: 'AI Insights', icon: Sparkles },
];
