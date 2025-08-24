import { useState } from "react";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import Dashboard from "../components/Dashboard";
import FoundItems from "../components/FoundItems";
import { useAuth } from "../context/AuthContext";
import "../App.css";
import ChatPage from "../components/ChatSystem/ChatPage";
import Header from "../components/Header";

const Home = () => {
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

export default Home;
