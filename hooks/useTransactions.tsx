import React, { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { Transaction, Budget } from '../types';
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
  setDoc
} from 'firebase/firestore';

interface AppContextType {
  transactions: Transaction[];
  budgets: Budget[];
  addTransaction: (t: Transaction) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<void>;
  updateBudget: (category: string, limit: number) => Promise<void>;
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
  const [loadingData, setLoadingData] = useState(false);

  // Subscribe to Transactions from Firestore
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
        // We use the Firestore Doc ID as our ID
        docs.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(docs);
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to Budgets from Firestore
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

  const addTransaction = async (t: Transaction): Promise<boolean> => {
    if (!user) return false;
    try {
      // Clean up the object before sending to Firestore
      const { id, ...transactionData } = t;
      
      // Firestore throws error on 'undefined', so we must ensure values are null or present
      await addDoc(collection(db, "transactions"), {
        amount: Number(transactionData.amount) || 0,
        category: transactionData.category,
        date: transactionData.date,
        note: transactionData.note || '',
        type: transactionData.type,
        // Use null instead of undefined for optional fields
        receiptUrl: transactionData.receiptUrl || null,
        userId: user.id,
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Failed to save transaction. Please check your internet connection.");
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

  const getIncome = () => transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const getExpenses = () => transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const getBalance = () => getIncome() - getExpenses();

  return (
    <AppContext.Provider value={{
      transactions,
      budgets,
      addTransaction,
      deleteTransaction,
      updateBudget,
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