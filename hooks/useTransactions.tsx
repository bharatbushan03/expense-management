import React, { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { Transaction, Budget, RecurringRule } from '../types';
import { useAuth } from './useAuth';
import { db } from '../firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  setDoc,
  getDocs
} from 'firebase/firestore';

interface AppContextType {
  transactions: Transaction[];
  budgets: Budget[];
  recurringRules: RecurringRule[];
  addTransaction: (t: Transaction) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<void>;
  updateBudget: (category: string, limit: number) => Promise<void>;
  addRecurringRule: (rule: RecurringRule) => Promise<boolean>;
  deleteRecurringRule: (id: string) => Promise<void>;
  getBalance: () => number;
  getIncome: () => number;
  getExpenses: () => number;
  loadingData: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Subscribe to Transactions
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    setLoadingData(true);
    const q = query(collection(db, "transactions"), where("userId", "==", user.id));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(docs);
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to Budgets
  useEffect(() => {
    if (!user) {
      setBudgets([]);
      return;
    }

    const q = query(collection(db, "budgets"), where("userId", "==", user.id));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs: Budget[] = [];
      querySnapshot.forEach((doc) => {
        docs.push(doc.data() as Budget);
      });
      setBudgets(docs);
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to Recurring Rules & Process Automation
  useEffect(() => {
    if (!user) {
      setRecurringRules([]);
      return;
    }

    const q = query(collection(db, "recurring_rules"), where("userId", "==", user.id));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const docs: RecurringRule[] = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as RecurringRule);
      });
      setRecurringRules(docs);
      
      // Check if any rule needs to be executed
      await processRecurringTransactions(docs);
    });

    return () => unsubscribe();
  }, [user]);

  // Helper function to process automation
  const processRecurringTransactions = async (rules: RecurringRule[]) => {
    if (!user) return;

    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    for (const rule of rules) {
      let needsExecution = false;
      
      if (!rule.lastProcessedDate) {
        // Never processed, check if today is >= rule day
        if (currentDay >= rule.dayOfMonth) {
            needsExecution = true;
        }
      } else {
        const lastRun = new Date(rule.lastProcessedDate);
        const lastRunMonth = lastRun.getMonth();
        const lastRunYear = lastRun.getFullYear();

        // If last run was in a previous month (or year), and we have passed the trigger day in current month
        if ((lastRunYear < currentYear || lastRunMonth < currentMonth) && currentDay >= rule.dayOfMonth) {
            needsExecution = true;
        }
      }

      if (needsExecution) {
        // 1. Create the Transaction
        // Construct date: Current Year, Current Month, Rule Day
        // Note: If today is 5th, Rule is 1st. We create it dated the 1st (or today? usually better to date it correctly)
        // Let's date it 'today' to avoid confusion, or construct the specific date. 
        // Let's construct the date so it appears correctly in history.
        const transactionDate = new Date(currentYear, currentMonth, rule.dayOfMonth);
        // Adjust for timezone offset to ensure ISO string doesn't shift date
        const offset = transactionDate.getTimezoneOffset();
        const adjustedDate = new Date(transactionDate.getTime() - (offset*60*1000));
        
        await addDoc(collection(db, "transactions"), {
            amount: Number(rule.amount),
            category: rule.category,
            date: adjustedDate.toISOString(),
            note: `${rule.note} (Auto)`,
            type: rule.type,
            receiptUrl: null,
            userId: user.id,
            createdAt: new Date().toISOString()
        });

        // 2. Update Rule lastProcessedDate
        const ruleRef = doc(db, "recurring_rules", rule.id);
        await updateDoc(ruleRef, {
            lastProcessedDate: new Date().toISOString()
        });
        console.log(`Executed recurring rule: ${rule.note}`);
      }
    }
  };

  const addTransaction = async (t: Transaction): Promise<boolean> => {
    if (!user) return false;
    try {
      const { id, ...transactionData } = t;
      await addDoc(collection(db, "transactions"), {
        amount: Number(transactionData.amount) || 0,
        category: transactionData.category,
        date: transactionData.date,
        note: transactionData.note || '',
        type: transactionData.type,
        receiptUrl: transactionData.receiptUrl || null,
        userId: user.id,
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error("Error adding document: ", e);
      return false;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "transactions", id));
    } catch (e) {
      console.error("Error deleting document: ", e);
    }
  };

  const updateBudget = async (category: string, limit: number) => {
    if (!user) return;
    try {
      const docId = `${user.id}_${category}`;
      await setDoc(doc(db, "budgets", docId), {
        userId: user.id,
        category,
        limit
      });
    } catch (e) {
      console.error("Error updating budget: ", e);
    }
  };

  const addRecurringRule = async (rule: RecurringRule): Promise<boolean> => {
    if (!user) return false;
    try {
        const { id, ...ruleData } = rule;
        await addDoc(collection(db, "recurring_rules"), {
            ...ruleData,
            userId: user.id,
            lastProcessedDate: null // Reset processed date on create so it runs immediately if due
        });
        return true;
    } catch (e) {
        console.error("Error adding rule:", e);
        return false;
    }
  };

  const deleteRecurringRule = async (id: string) => {
      if(!user) return;
      try {
          await deleteDoc(doc(db, "recurring_rules", id));
      } catch (e) {
          console.error("Error deleting rule:", e);
      }
  }

  const getIncome = () => transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const getExpenses = () => transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const getBalance = () => getIncome() - getExpenses();

  return (
    <AppContext.Provider value={{
      transactions,
      budgets,
      recurringRules,
      addTransaction,
      deleteTransaction,
      updateBudget,
      addRecurringRule,
      deleteRecurringRule,
      getBalance,
      getIncome,
      getExpenses,
      loadingData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useTransactions must be used within AppProvider");
  return context;
};