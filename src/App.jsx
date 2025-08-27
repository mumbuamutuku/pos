import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './pages/Layout';
import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import UsersPage from './pages/UsersPage';
import ExpensePage from './pages/ExpensePage';
import CustomerManagement from './pages/CustomerManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={
            <ProtectedRoute>
              <POSPage />
            </ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute requiredRole="inventory_staff">
              <InventoryPage />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute requiredRole="manager">
              <ReportsPage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={<h1>Settings</h1>} />
          <Route path="/users" element={
            <ProtectedRoute requiredRole="admin">
              <UsersPage />
              </ProtectedRoute>
          } />
          <Route path="/expense" element={
            <ProtectedRoute requiredRole="admin">
              <ExpensePage />
              </ProtectedRoute>
          } />
          <Route path="/customers" element={ 
            <ProtectedRoute requiredRole="admin">
              <CustomerManagement />
              </ProtectedRoute>
          }/>
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;