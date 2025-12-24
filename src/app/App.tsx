import { BrowserRouter } from "react-router";
import { AuthProvider } from "@/app/auth/AuthContext";
import AppRoutes from "./AppRoutes";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
