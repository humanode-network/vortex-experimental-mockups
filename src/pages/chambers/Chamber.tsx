import { useParams } from "react-router";

const Chamber: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="app-page">
      <h1>Chamber</h1>
      <p>Chamber detail placeholder for: {id ?? "unknown"}</p>
    </div>
  );
};

export default Chamber;
