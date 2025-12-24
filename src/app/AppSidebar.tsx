import { NavLink } from "react-router";
import { useState } from "react";
import "./AppSidebar.css";
import clsx from "clsx";
import {
  Activity,
  BookOpen,
  Eye,
  Flag,
  Gavel,
  Landmark,
  Lightbulb,
  Rocket,
  Scale,
  Settings,
  SlidersHorizontal,
  User,
  Users,
  FileText,
} from "lucide-react";
import { AuthSidebarPanel } from "@/app/auth/AuthContext";

const navClass = ({ isActive }: { isActive: boolean }) =>
  clsx("sidebar__link", isActive && "sidebar__link--active");
const nestedNavClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "sidebar__link sidebar__link--nested",
    isActive && "sidebar__link--active",
  );

type NavItem = {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const AppSidebar: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navItems: NavItem[] = [
    { to: "/app/feed", label: "Feed", Icon: Activity },
    { to: "/app/my-governance", label: "My governance", Icon: Gavel },
    { to: "/app/proposals", label: "Proposals", Icon: FileText },
    { to: "/app/chambers", label: "Chambers", Icon: Lightbulb },
    { to: "/app/human-nodes", label: "Human nodes", Icon: Users },
    { to: "/app/formation", label: "Formation", Icon: Rocket },
    { to: "/app/factions", label: "Factions", Icon: Flag },
    { to: "/app/cm", label: "CM panel", Icon: Scale },
    { to: "/app/invision", label: "Invision", Icon: Eye },
    { to: "/app/courts", label: "Courts", Icon: Landmark },
    { to: "/app/vortexopedia", label: "Vortexopedia", Icon: BookOpen },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span>Vortex</span>
        <span className="sidebar__logo" aria-hidden="true"></span>
      </div>
      <AuthSidebarPanel />
      <nav className="sidebar__nav" aria-label="Primary">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink key={to} className={navClass} to={to}>
            <Icon className="sidebar__icon" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={clsx(
            "sidebar__link",
            settingsOpen && "sidebar__link--active",
          )}
          onClick={() => setSettingsOpen((open) => !open)}
        >
          <Settings className="sidebar__icon" aria-hidden="true" />
          <span>Settings</span>
        </button>
        {settingsOpen && (
          <div className="pt-1 pl-4">
            <NavLink className={nestedNavClass} to="/app/settings">
              <SlidersHorizontal className="sidebar__icon" aria-hidden="true" />
              <span>General</span>
            </NavLink>
            <NavLink className={nestedNavClass} to="/app/profile">
              <User className="sidebar__icon" aria-hidden="true" />
              <span>My profile</span>
            </NavLink>
          </div>
        )}
      </nav>

      {children}
    </aside>
  );
};

export default AppSidebar;
