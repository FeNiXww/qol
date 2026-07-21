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
import YourName from '@/pages/onboarding/YourName';
import Nationality from '@/pages/onboarding/Nationality';
import AboutYou from '@/pages/onboarding/AboutYou';
import Hobbies from '@/pages/onboarding/Hobbies';
import ProfileSetup from '@/pages/onboarding/ProfileSetup';

// Landing
import Landing from '@/pages/Landing';
import LanguagePicker from '@/pages/LanguagePicker';

// Tab pages
import Discover from '@/pages/tabs/Discover';
import Matches from '@/pages/tabs/Matches';
import ProfileTab from '@/pages/tabs/Profile';
import MiniGames from '@/pages/tabs/MiniGames';
import Chat from '@/pages/Chat';
import GameRoom from '@/pages/GameRoom';
import LetterMatch from '@/pages/LetterMatch';
import DictionaryPractice from '@/pages/DictionaryPractice';

// Layout & context
import Layout from '@/components/Layout';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { LanguageProvider, useLang } from '@/contexts/LanguageContext';
import { base44 } from '@/api/base44Client';

import Settings from '@/pages/Settings';
import ProtectedRoute from '@/components/ProtectedRoute';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user: currentUser } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#E6E2D8' }}>
        <div className="text-center">
          <img
            src="https://media.base44.com/images/public/6a5874b8ce4d2dc8cf35eb52/a3fa26d38_Untitleddesign.png"
            alt="QOL"
            className="w-20 h-20 object-contain mx-auto mb-4 animate-pulse"
          />

          <div className="w-8 h-8 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      base44.auth.logout();
      window.location.href = '/sign-up';
      return null;
    }
    // For auth_required or any other auth error, clear the stale token then redirect
    base44.auth.logout();
    window.location.href = '/language';
    return null;
  }

  return (
    <ProfileProvider currentUser={currentUser}>
      <Routes>
        {/* Public routes */}
        <Route path="/language" element={<LanguagePicker />} />
        <Route path="/welcome" element={<Landing />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/language" replace />} />}>
          {/* Onboarding */}
          <Route path="/onboarding/name" element={<YourName />} />
          <Route path="/onboarding/nationality" element={<Nationality />} />
          <Route path="/onboarding/about" element={<AboutYou />} />
          <Route path="/onboarding/hobbies" element={<Hobbies />} />
          <Route path="/onboarding/profile-setup" element={<ProfileSetup />} />

          {/* Main app with tab layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Discover />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/games" element={<MiniGames />} />
            <Route path="/profile" element={<ProfileTab />} />
            <Route path="/chat/:matchId" element={<Chat />} />
          </Route>
          <Route path="/game/:sessionId" element={<GameRoom />} />
          <Route path="/letter-match" element={<LetterMatch />} />
          <Route path="/dictionary" element={<DictionaryPractice />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/language" replace />} />
      </Routes>
    </ProfileProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;