import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import TickerTape from './components/TickerTape';
import FeedPage from './pages/FeedPage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900">
      <TickerTape />
      <Header />
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<FeedPage />} />
      </Routes>
    </div>
  );
}
