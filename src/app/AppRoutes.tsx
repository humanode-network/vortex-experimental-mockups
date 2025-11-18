import { Outlet, Route, Routes } from "react-router";
import Welcome from "../pages/Welcome";
import AppShell from "./AppShell";
import Page1 from "../pages/Page1";
import HumanNodes from "../pages/human-nodes/HumanNodes";
import Proposals from "../pages/proposals/Proposals";
import Chambers from "../pages/chambers/Chambers";
import Formation from "../pages/formation/Formation";
import Invision from "../pages/invision/Invision";
import Factions from "../pages/factions/Factions";
import Settings from "../pages/Settings";
import Profile from "../pages/Profile";
import HumanNode from "../pages/human-nodes/HumanNode";
import Chamber from "../pages/chambers/Chamber";

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
        <Route path="/page1" element={<Page1 />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/factions" element={<Factions />} />
        <Route path="/human-nodes" element={<HumanNodes />} />
        <Route path="/human-nodes/:id" element={<HumanNode />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="/chambers" element={<Chambers />} />
        <Route path="/chambers/:id" element={<Chamber />} />
        <Route path="/formation" element={<Formation />} />
        <Route path="/invision" element={<Invision />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
