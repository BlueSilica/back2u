import { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Footer from "./components/Footer";
import Dashboard from "./components/Dashboard";
import FoundItems from "./components/FoundItems";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./App.css";
import ChatPage from "./components/ChatSystem/ChatPage";

const AppContent = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<
    "home" | "dashboard" | "chat" | "found-items"
  >(() => {
    if (window.location.pathname === "/chat") return "chat";
    if (window.location.pathname === "/found-items") return "found-items";
    return "home";
  });

  const handleNavigation = (
    view: "home" | "dashboard" | "chat" | "found-items"
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
        ) : currentView === "found-items" ? (
          <FoundItems />
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
