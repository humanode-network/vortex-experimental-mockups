import { useParams } from "react-router";

const HumanNode: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="app-page">
      <h1>Human node profile</h1>
      <p>Profile detail placeholder for node: {id ?? "unknown"}</p>
    </div>
  );
};

export default HumanNode;
