type LibraryConnectionScreenProps = {
  error?: string;
  onCreate: () => void;
  onOpen: () => void;
};

export function LibraryConnectionScreen({ error, onCreate, onOpen }: LibraryConnectionScreenProps) {
  return (
    <main className="connection-shell">
      <section className="connection-card" aria-labelledby="connection-title">
        <p className="eyebrow">Salsa library</p>
        <h1 id="connection-title">Connecter votre bibliotheque</h1>
        <p>
          Choisissez un dossier sur votre ordinateur. Vos mouvements, schemas et videos locales
          resteront dans ce dossier, meme apres un nettoyage du navigateur.
        </p>

        {error ? (
          <p className="connection-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="connection-actions">
          <button type="button" className="add-button" onClick={onCreate}>
            Creer une bibliotheque
          </button>
          <button type="button" className="secondary-button" onClick={onOpen}>
            Ouvrir une bibliotheque
          </button>
        </div>

        <p className="connection-note">Compatible avec Chrome et Edge sur ordinateur.</p>
      </section>
    </main>
  );
}
