import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { AppProvider } from './hooks/useTransactions';
import { AuthProvider } from './hooks/useAuth';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout><Dashboard /></Layout>} path="/" />
              <Route element={<Layout><Transactions /></Layout>} path="/transactions" />
              <Route element={<Layout><Budgets /></Layout>} path="/budgets" />
              <Route element={<Layout><Insights /></Layout>} path="/insights" />
              <Route element={<Layout><Settings /></Layout>} path="/settings" />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;