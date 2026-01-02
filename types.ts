export type TransactionType = 'income' | 'expense';

export type Category = 
  | 'Food' 
  | 'Travel' 
  | 'Rent' 
  | 'Bills' 
  | 'Shopping' 
  | 'Salary' 
  | 'Investment' 
  | 'Freelance'
  | 'Custom';

export interface Transaction {
  id: string;
  amount: number;
  category: Category;
  date: string; // ISO Date string
  note: string;
  type: TransactionType;
  receiptUrl?: string; // Base64 or URL
}

export interface Budget {
  category: Category;
  limit: number;
}

export interface RecurringRule {
  id: string;
  type: TransactionType;
  category: Category;
  amount: number;
  dayOfMonth: number; // 1-31
  note: string;
  lastProcessedDate?: string; // ISO Date string of last execution
}

export interface AIInsight {
  type: 'alert' | 'advice' | 'trend';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface DailySpending {
  date: string;
  amount: number;
}