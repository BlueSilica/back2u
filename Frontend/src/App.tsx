import { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Footer from "./components/Footer";
import Dashboard from "./components/Dashboard";
import UserProfile from "./components/UserProfile";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./App.css";
import ChatPage from "./components/ChatSystem/ChatPage";

const AppContent = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<
    "home" | "dashboard" | "chat" | "profile"
  >(() => {
    if (window.location.pathname === "/chat") return "chat";
    if (window.location.pathname === "/profile") return "profile";
    return "home";
  });

  const handleNavigation = (
    view: "home" | "dashboard" | "chat" | "profile"
  ) => {
    setCurrentView(view);
  };

  return (
    <>
      <Header currentView={currentView} onNavigate={handleNavigation} />
      <main>
        {currentView === "home" ? (
          <>
            <Hero />
            <Features />
          </>
        ) : currentView === "chat" ? (
          <ChatPage />
        ) : currentView === "profile" ? (
          <UserProfile />
        ) : user ? (
          <Dashboard />
        ) : (
          <>
            <Hero />
            <Features />
          </>
        )}
      </main>
      {currentView === "home" && <Footer />}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
