import { Navigate, Outlet, Route, Routes, useLocation } from "react-router";
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
import ProposalDrafts from "../pages/proposals/ProposalDrafts";
import ProposalDraft from "../pages/proposals/ProposalDraft";
import FullHistory from "../pages/human-nodes/FullHistory";
import Landing from "../pages/Landing";

// Backwards-compat redirects for old app URLs (pre `/app` split).
// Safe to delete once you no longer need to support old bookmarks/links.
const LegacyToAppRedirect: React.FC = () => {
  const location = useLocation();
  return (
    <Navigate
      to={`/app${location.pathname}${location.search}${location.hash}`}
      replace
    />
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/app"
        element={
          <AppShell>
            <Outlet />
          </AppShell>
        }
      >
        <Route index element={<Navigate to="feed" replace />} />
        <Route path="feed" element={<Feed />} />
        <Route path="profile" element={<Profile />} />
        <Route path="factions" element={<Factions />} />
        <Route path="factions/:id" element={<Faction />} />
        <Route path="human-nodes" element={<HumanNodes />} />
        <Route path="human-nodes/:id" element={<HumanNode />} />
        <Route path="human-nodes/:id/history" element={<FullHistory />} />
        <Route path="courts" element={<Courts />} />
        <Route path="courts/:id" element={<Courtroom />} />
        <Route path="cm" element={<CMPanel />} />
        <Route path="proposals" element={<Proposals />} />
        <Route path="proposals/drafts" element={<ProposalDrafts />} />
        <Route path="proposals/drafts/:id" element={<ProposalDraft />} />
        <Route path="proposals/new" element={<ProposalCreation />} />
        <Route path="proposals/:id/pp" element={<ProposalPP />} />
        <Route path="proposals/:id/chamber" element={<ProposalChamber />} />
        <Route path="proposals/:id/formation" element={<ProposalFormation />} />
        <Route path="chambers" element={<Chambers />} />
        <Route path="chambers/:id" element={<Chamber />} />
        <Route path="formation" element={<Formation />} />
        <Route path="invision" element={<Invision />} />
        <Route path="vortexopedia" element={<Vortexopedia />} />
        <Route path="settings" element={<General />} />
        <Route path="my-governance" element={<MyGovernance />} />
      </Route>

      {/* Legacy redirects (old app URLs -> /app/*). */}
      <Route path="/feed" element={<LegacyToAppRedirect />} />
      <Route path="/profile" element={<LegacyToAppRedirect />} />
      <Route path="/factions" element={<LegacyToAppRedirect />} />
      <Route path="/factions/:id" element={<LegacyToAppRedirect />} />
      <Route path="/human-nodes" element={<LegacyToAppRedirect />} />
      <Route path="/human-nodes/:id" element={<LegacyToAppRedirect />} />
      <Route
        path="/human-nodes/:id/history"
        element={<LegacyToAppRedirect />}
      />
      <Route path="/courts" element={<LegacyToAppRedirect />} />
      <Route path="/courts/:id" element={<LegacyToAppRedirect />} />
      <Route path="/cm" element={<LegacyToAppRedirect />} />
      <Route path="/proposals" element={<LegacyToAppRedirect />} />
      <Route path="/proposals/drafts" element={<LegacyToAppRedirect />} />
      <Route path="/proposals/drafts/:id" element={<LegacyToAppRedirect />} />
      <Route path="/proposals/new" element={<LegacyToAppRedirect />} />
      <Route path="/proposals/:id/pp" element={<LegacyToAppRedirect />} />
      <Route path="/proposals/:id/chamber" element={<LegacyToAppRedirect />} />
      <Route
        path="/proposals/:id/formation"
        element={<LegacyToAppRedirect />}
      />
      <Route path="/chambers" element={<LegacyToAppRedirect />} />
      <Route path="/chambers/:id" element={<LegacyToAppRedirect />} />
      <Route path="/formation" element={<LegacyToAppRedirect />} />
      <Route path="/invision" element={<LegacyToAppRedirect />} />
      <Route path="/vortexopedia" element={<LegacyToAppRedirect />} />
      <Route path="/settings" element={<LegacyToAppRedirect />} />
      <Route path="/my-governance" element={<LegacyToAppRedirect />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
