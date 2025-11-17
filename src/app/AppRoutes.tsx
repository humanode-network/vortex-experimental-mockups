import { Outlet, Route, Routes } from "react-router";
import Welcome from "../pages/Welcome";
import AppShell from "./AppShell";
import Chambers from "../pages/Chambers";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        element={
          <AppShell>
            <Outlet />
          </AppShell>
        }
      >
        <Route path="/" element={<Welcome />} />
        <Route path="/chambers" element={<Chambers />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
