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
    { to: "/feed", label: "Feed", Icon: Activity },
    { to: "/my-governance", label: "My governance", Icon: Gavel },
    { to: "/proposals", label: "Proposals", Icon: FileText },
    { to: "/chambers", label: "Chambers", Icon: Lightbulb },
    { to: "/human-nodes", label: "Human nodes", Icon: Users },
    { to: "/formation", label: "Formation", Icon: Rocket },
    { to: "/factions", label: "Factions", Icon: Flag },
    { to: "/cm", label: "CM panel", Icon: Scale },
    { to: "/invision", label: "Invision", Icon: Eye },
    { to: "/courts", label: "Courts", Icon: Landmark },
    { to: "/vortexopedia", label: "Vortexopedia", Icon: BookOpen },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span>Vortex</span>
        <span className="sidebar__logo" aria-hidden="true"></span>
      </div>
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
            <NavLink className={nestedNavClass} to="/settings">
              <SlidersHorizontal className="sidebar__icon" aria-hidden="true" />
              <span>General</span>
            </NavLink>
            <NavLink className={nestedNavClass} to="/profile">
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
