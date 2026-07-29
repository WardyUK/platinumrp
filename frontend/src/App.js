import { useEffect, useState, useCallback } from 'react';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ServerMap from '@/components/ServerMap';
import Dashboard from '@/components/Dashboard';
import Store from '@/components/Store';
import RulesLore from '@/components/RulesLore';
import Footer from '@/components/Footer';

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('ncrp_token');
    if (!token) {
      setLoadingUser(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (e) {
      localStorage.removeItem('ncrp_token');
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    // Capture JWT handed back by the Discord OAuth callback redirect.
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const authErr = params.get('auth');
    if (token) {
      localStorage.setItem('ncrp_token', token);
      window.history.replaceState({}, '', '/');
      toast.success('Logged in via Discord', { description: 'Welcome back to the city.' });
    }
    if (authErr === 'error') {
      window.history.replaceState({}, '', '/');
      toast.error('Discord login failed', { description: 'Please try again.' });
    }
    fetchMe();
  }, [fetchMe]);

  const logout = () => {
    localStorage.removeItem('ncrp_token');
    setUser(null);
    toast('Signed out', { description: 'See you back in the city.' });
  };

  return (
    <div className="App grain relative bg-zinc-950 text-white font-ibm overflow-x-hidden">
      <Navbar user={user} onLogout={logout} />
      <main className="relative z-[2]">
        <Hero />
        <ServerMap />
        <Dashboard user={user} loading={loadingUser} onRefresh={fetchMe} />
        <Store />
        <RulesLore />
      </main>
      <Footer />
      <Toaster position="bottom-right" theme="dark" richColors />
    </div>
  );
}

export default App;
