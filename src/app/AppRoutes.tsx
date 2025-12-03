import { Navigate, Outlet, Route, Routes } from "react-router";
import AppShell from "./AppShell";
import HumanNodes from "../pages/human-nodes/HumanNodes";
import Proposals from "../pages/proposals/Proposals";
import Chambers from "../pages/chambers/Chambers";
import Formation from "../pages/formation/Formation";
import Invision from "../pages/invision/Invision";
import Vortexopedia from "../pages/Vortexopedia";
import Factions from "../pages/factions/Factions";
import Faction from "../pages/factions/Faction";
import ProposalPP from "../pages/proposals/ProposalPP";
import ProposalChamber from "../pages/proposals/ProposalChamber";
import ProposalFormation from "../pages/proposals/ProposalFormation";
import General from "../pages/General";
import Profile from "../pages/profile/Profile";
import HumanNode from "../pages/human-nodes/HumanNode";
import Chamber from "../pages/chambers/Chamber";
import Feed from "../pages/feed/Feed";
import Courts from "../pages/courts/Courts";
import CMPanel from "../pages/cm/CMPanel";
import Courtroom from "../pages/courts/Courtroom";
import ProposalCreation from "../pages/proposals/ProposalCreation";
import MyGovernance from "../pages/MyGovernance";

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
        <Route path="/" element={<Navigate to="/feed" />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/factions" element={<Factions />} />
        <Route path="/factions/:id" element={<Faction />} />
        <Route path="/human-nodes" element={<HumanNodes />} />
        <Route path="/human-nodes/:id" element={<HumanNode />} />
        <Route path="/courts" element={<Courts />} />
        <Route path="/courts/:id" element={<Courtroom />} />
        <Route path="/cm" element={<CMPanel />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="/proposals/new" element={<ProposalCreation />} />
        <Route path="/proposals/:id/pp" element={<ProposalPP />} />
        <Route path="/proposals/:id/chamber" element={<ProposalChamber />} />
        <Route
          path="/proposals/:id/formation"
          element={<ProposalFormation />}
        />
        <Route path="/chambers" element={<Chambers />} />
        <Route path="/chambers/:id" element={<Chamber />} />
        <Route path="/formation" element={<Formation />} />
        <Route path="/invision" element={<Invision />} />
        <Route path="/vortexopedia" element={<Vortexopedia />} />
        <Route path="/settings" element={<General />} />
        <Route path="/my-governance" element={<MyGovernance />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
