const levels = [
  { number: '01', label: 'Niveau 1', description: 'Les bases pour entrer dans la danse.' },
  { number: '02', label: 'Niveau 2', description: 'Les enchainements qui prennent forme.' },
  { number: '03', label: 'Niveau 3', description: 'Plus de fluidite et de variations.' },
  { number: '04', label: 'Niveau 4', description: 'Les mouvements a garder en memoire.' },
];

function App() {
  return (
    <main className="library-shell">
      <header className="library-header">
        <div>
          <p className="eyebrow">Salsa library</p>
          <h1>Bibliotheque de mouvements</h1>
        </div>
        <button type="button" className="add-button">
          Ajouter un mouvement
        </button>
      </header>

      <section className="intro" aria-labelledby="intro-title">
        <p className="intro-kicker">Ton carnet de pratique</p>
        <h2 id="intro-title">Retrouve un mouvement, puis danse-le a nouveau.</h2>
        <p>
          Les fiches seront organisees par niveau et conserveront les reperes utiles entre deux
          cours.
        </p>
      </section>

      <section aria-labelledby="levels-title">
        <div className="section-heading">
          <h2 id="levels-title">Choisir un niveau</h2>
          <span>0 mouvement</span>
        </div>
        <div className="level-grid">
          {levels.map((level) => (
            <button type="button" className="level-card" key={level.number}>
              <span className="level-number">{level.number}</span>
              <span className="level-label">{level.label}</span>
              <span className="level-description">{level.description}</span>
              <span className="level-arrow" aria-hidden="true">
                ↗
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
