import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./components/layout/ThemeProvider";
import AppRouter from "./routes/AppRouter";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
