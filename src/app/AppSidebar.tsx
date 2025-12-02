import { NavLink } from "react-router";
import { useState } from "react";
import "./AppSidebar.css";
import clsx from "clsx";

const navClass = ({ isActive }: { isActive: boolean }) =>
  clsx("sidebar__link", isActive && "sidebar__link--active");
const nestedNavClass = ({ isActive }: { isActive: boolean }) =>
  clsx("sidebar__link sidebar__link--nested", isActive && "sidebar__link--active");

const AppSidebar: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span>Vortex</span>
        <span className="sidebar__logo" aria-hidden="true"></span>
      </div>
      <nav className="sidebar__nav" aria-label="Primary">
        <NavLink className={navClass} to="/feed">
          Feed
        </NavLink>
        <NavLink className={navClass} to="/proposals">
          Proposals
        </NavLink>
        <NavLink className={navClass} to="/chambers">
          Chambers
        </NavLink>
        <NavLink className={navClass} to="/human-nodes">
          Human nodes
        </NavLink>
        <NavLink className={navClass} to="/formation">
          Formation
        </NavLink>
        <NavLink className={navClass} to="/cm">
          CM panel
        </NavLink>
        <NavLink className={navClass} to="/invision">
          Invision
        </NavLink>
        <NavLink className={navClass} to="/courts">
          Courts
        </NavLink>
        <NavLink className={navClass} to="/vortexopedia">
          Vortexopedia
        </NavLink>
        <button
          type="button"
          className={clsx("sidebar__link", settingsOpen && "sidebar__link--active")}
          onClick={() => setSettingsOpen((open) => !open)}
        >
          Settings
        </button>
        {settingsOpen && (
          <div className="pl-4 pt-1">
            <NavLink className={nestedNavClass} to="/settings">
              General
            </NavLink>
            <NavLink className={nestedNavClass} to="/profile">
              My profile
            </NavLink>
          </div>
        )}
      </nav>

      {children}
    </aside>
  );
};

export default AppSidebar;
