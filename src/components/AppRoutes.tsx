import { Route, Routes } from "react-router";
import Welcome from "./Welcome";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
    </Routes>
  );
};

export default AppRoutes;
