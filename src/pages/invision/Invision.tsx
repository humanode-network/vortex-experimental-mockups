import "./invision.css";

const Invision: React.FC = () => {
  return (
    <div className="app-page invision-page">
      <h1>Invision</h1>
      <p className="eyebrow">Deterrence & oversight signals</p>

      <section className="invision-grid">
        <article className="invision-card">
          <h3>Invision score</h3>
          <p>82 / 100 · Deterrence influence rating across last 12 epochs.</p>
        </article>
        <article className="invision-card">
          <h3>Quorum participation</h3>
          <p>91% average participation on proposals in current era.</p>
        </article>
        <article className="invision-card">
          <h3>Delegation share</h3>
          <p>3.4% of all delegated votes from governors.</p>
        </article>
        <article className="invision-card">
          <h3>Alerts</h3>
          <p>No outstanding flags.</p>
        </article>
      </section>
    </div>
  );
};

export default Invision;
