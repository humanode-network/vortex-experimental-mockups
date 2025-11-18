import AppSidebar from "./AppSidebar";

import "./AppShell.css";

const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className="app-shell">
        <AppSidebar />

        <main id="main" className="workspace">
          {children}
        </main>
      </div>
    </>
  );
};

export default AppShell;
