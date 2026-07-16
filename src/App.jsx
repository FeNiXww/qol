import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';

// Auth pages
import SignIn from '@/pages/auth/SignIn';
import SignUp from '@/pages/auth/SignUp';
import VerifyOTP from '@/pages/auth/VerifyOTP';

// Onboarding pages
import Nationality from '@/pages/onboarding/Nationality';
import AboutYou from '@/pages/onboarding/AboutYou';
import Hobbies from '@/pages/onboarding/Hobbies';
import ProfileSetup from '@/pages/onboarding/ProfileSetup';

// Tab pages
import Discover from '@/pages/tabs/Discover';
import Matches from '@/pages/tabs/Matches';
import ProfileTab from '@/pages/tabs/Profile';
import Chat from '@/pages/Chat';

// Layout & context
import Layout from '@/components/Layout';
import { ProfileProvider } from '@/contexts/ProfileContext';

import ProtectedRoute from '@/components/ProtectedRoute';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, currentUser } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #17998A, #F4801F)' }}>
            <span className="text-white text-3xl font-black">Q</span>
          </div>
          <div className="w-8 h-8 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <ProfileProvider currentUser={currentUser}>
      <Routes>
        {/* Public auth routes */}
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/sign-in" replace />} />}>
          {/* Onboarding */}
          <Route path="/onboarding/nationality" element={<Nationality />} />
          <Route path="/onboarding/about" element={<AboutYou />} />
          <Route path="/onboarding/hobbies" element={<Hobbies />} />
          <Route path="/onboarding/profile-setup" element={<ProfileSetup />} />

          {/* Main app with tab layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Discover />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/profile" element={<ProfileTab />} />
            <Route path="/chat/:matchId" element={<Chat />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProfileProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;