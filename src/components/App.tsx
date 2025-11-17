import AppRoutes from "./AppRoutes";
import { BrowserRouter } from "react-router";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
