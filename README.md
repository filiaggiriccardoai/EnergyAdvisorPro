# Energy Advisor Pro

Prima base applicativa per consulenti energetici italiani, con React, TypeScript, Vite ed Electron. I file sono stati creati direttamente nell'ambiente: GitHub non è necessario per sviluppare o avviare il progetto.

## Avvio

Richiede Node.js 22 o successivo e npm.

```bash
npm install
npm run dev
```

Apri l'indirizzo mostrato da Vite (normalmente http://localhost:5173). Per verificare la compilazione: `npm run build`.

## App desktop e Windows

```bash
npm run desktop
```

Su un PC Windows, per generare il setup NSIS:

```bash
npm run dist:win
```

Il risultato sarà nella cartella `release/`. La configurazione dell'installer è predisposta; il setup e l'esecuzione Windows non sono stati verificati in questo ambiente Linux. Prima di distribuire servono collaudo Windows, icona e firma del codice. L'app desktop carica i file compilati dal disco: dashboard, archivio e PDF funzionano senza Internet. Installazione delle dipendenze e creazione iniziale del pacchetto richiedono rete. La versione web di sviluppo richiede il server Vite; non è ancora una PWA installabile.

## Funzioni disponibili

- Dashboard con quattro clienti e dati energetici dimostrativi.
- Creazione, ricerca e modifica della scheda cliente completa, con campi facoltativi.
- Salvataggio delle schede in localStorage e lettura al riavvio, compatibile con i clienti della versione 0.1.0.
- Esportazione JSON dell'archivio; ripristino da file da implementare.
- PDF dimostrativo non contrattuale dalla scheda cliente.
- Sezioni con roadmap per bollette, impianti, incentivi e scenari.

I dati iniziali sono esempi. Non sono implementati analisi delle bollette, dimensionamento, calcolo fiscale o Conto Termico 3.0, confronto economico o collegamenti PUN/PSV/PVGIS. Il grafico è illustrativo. Nessuna percentuale normativa è stata inventata.

## Archiviazione

Chiave `energy-advisor-pro:clients:v1`, nel profilo del browser o di Electron. Nessun backend, sincronizzazione o font remoto. Cancellare il profilo o i dati del browser elimina l'archivio. I dati non sono cifrati: questa versione è una base dimostrativa, da consolidare prima dell'uso con dati personali reali. Per la versione professionale prevedere SQLite tramite API Electron limitata, backup/ripristino, migrazioni, validazione e protezione dei dati.

## Struttura

- `src/App.tsx`: dashboard e flussi iniziali.
- `src/data.ts`: tipi, dati demo, lettura e validazione archivio.
- `src/styles.css`: interfaccia responsive.
- `electron/main.cjs`: contenitore desktop con isolamento del renderer.
- `vite.config.ts`: build con percorsi relativi per Electron.

## GitHub opzionale: passo dopo passo

1. Accedi a GitHub e scegli **New repository**.
2. Repository del progetto: `filiaggiriccardoai/EnergyAdvisorPro` (pubblico). Se già creato, non ricrearlo.
3. Apri un terminale nella cartella del progetto sul tuo PC.
4. Esegui:

```bash
git init
git add .
git commit -m "Prima dashboard Energy Advisor Pro"
git branch -M main
git remote add origin https://github.com/filiaggiriccardoai/EnergyAdvisorPro.git
git push -u origin main
```

5. Completa l'autenticazione con Git Credential Manager o `gh auth login`; non inserire token nel codice.
6. Per usarlo in un ambiente collegato a GitHub, collega l'account nelle impostazioni dell'ambiente, autorizza il repository e selezionalo come progetto. Le etichette dipendono dall'interfaccia disponibile.

Non caricare dati dei clienti, backup, credenziali o preventivi reali nel repository. `.gitignore` esclude dipendenze, build e installer. Il caricamento remoto richiede credenziali GitHub autorizzate.

## Prossimi incrementi

1. Archivio clienti: eliminazione controllata, backup/ripristino e SQLite.
2. Bollette luce/gas con input strutturato e verifica dei totali prima dell'importazione PDF.
3. Motore di dimensionamento con ipotesi esplicite e unità validate.
4. Scenari economici e regole incentivi versionate e documentate da fonti ufficiali.
5. Preventivi completi e integrazioni online con cache offline e date delle rilevazioni.

## Anteprima su smartphone Android

Verifica effettuata: build TypeScript/Vite riuscita e server di anteprima con risposta HTTP 200. Non è stata eseguita una verifica visuale in browser. Il server dell'ambiente remoto non ha un URL pubblico o un inoltro porta disponibile: localhost sul telefono indica il telefono, non questo ambiente.

È disponibile `.github/workflows/preview.yml` per pubblicare la build su GitHub Pages. La presenza della configurazione non conferma il caricamento o la pubblicazione.

1. Carica il progetto in un repository GitHub, includendo `package-lock.json` e `.github/workflows/preview.yml`, escludendo `node_modules` e backup clienti.
2. Da Chrome su Android, apri il repository; se necessario attiva **Sito desktop** nel menu di Chrome.
3. In **Settings → Pages → Build and deployment → Source**, seleziona **GitHub Actions**.
4. In **Actions → Dashboard preview → Run workflow**, seleziona `main` e avvia il workflow.
5. Al completamento apri il link dell'ambiente `github-pages`, normalmente `https://filiaggiriccardoai.github.io/EnergyAdvisorPro/`.

GitHub Pages standard rende la dashboard accessibile pubblicamente: usa soltanto dati demo. I clienti aggiunti restano nel localStorage del browser utilizzato. Disponibilità di Pages per repository privati dipende dal piano GitHub; scegli hosting privato se necessario.

Alternativa con PC sulla stessa Wi-Fi: esegui `npm run dev` sul PC, consenti Node.js sulla rete privata nel firewall e apri da Chrome sul telefono `http://IP-LOCALE-DEL-PC:5173`. Il PC deve restare acceso. Questo non rende accessibile il server remoto di questa chat.

In questo ambiente l'installazione è stata eseguita con `--ignore-scripts` per verificare l'anteprima web senza scaricare il runtime Electron. Prima di usare `npm run desktop`, installare normalmente le dipendenze su PC o eseguire `npm rebuild electron` con accesso di rete.

## Percorso GitHub Pages

La build `npm run build -- --mode github-pages` usa `/EnergyAdvisorPro/`, rispettando le maiuscole del repository. La build normale conserva `./` per Electron. Il workflow usa la modalità `github-pages`. Il link previsto diventa disponibile solo dopo il deploy riuscito.

I nomi dei clienti e del consulente nel codice sono fittizi, generati per la demo; non provengono da un archivio clienti reale.

## Scheda cliente completa (0.2.0)

Da **Clienti**, apri la freccia sulla riga del cliente per modificare la scheda. **Nuovo cliente** apre la stessa scheda vuota. Inserisci le informazioni disponibili e scegli **Salva scheda**. Per controllare la persistenza, ricarica la pagina e riapri il cliente nello stesso browser.

La scheda include anagrafica e contatti, indirizzo, comune e provincia, superficie riscaldata, anno di costruzione, isolamento, infissi e tipo di edificio. Include consumo e spesa annui luce/gas, riferimento delle bollette, riscaldamento, caldaia e terminali multipli, fotovoltaico, accumulo e climatizzatori esistenti, obiettivi e note.

Tutti i campi sono facoltativi, anche il nome. Un campo numerico vuoto indica dato non disponibile; zero è un valore esplicito. Consumo e spesa hanno origini distinte (effettivo/effettiva o stimato/stimata). Un dato privo di origine resta non classificato; i valori precedenti non vengono convertiti automaticamente in misure effettive. I numeri negativi, gli anni non validi e i recapiti email non validi vengono rifiutati dal modulo. I dati non noti non vengono stimati automaticamente.

La chiave `energy-advisor-pro:clients:v1` è invariata: la lettura non riscrive i clienti precedenti e l'aggiunta di dettagli è compatibile con il vecchio schema. Modificare una scheda preserva gli altri clienti e i dati del progetto (ID, stato, intervento e investimento). In caso di archivio illeggibile il salvataggio è bloccato; in caso di errore di scrittura la scheda resta aperta. Una scheda del browser con dati obsoleti non può sovrascrivere silenziosamente gli aggiornamenti di un'altra scheda. Il backup JSON include tutti i dettagli. Prima di cancellare i dati del browser, esporta un backup; il ripristino guidato non è ancora implementato.

I dati inseriti non sono inviati a GitHub o a un server: restano nel localStorage del browser sul dispositivo. La persistenza riguarda lo stesso browser e lo stesso indirizzo del sito; non c'è sincronizzazione tra telefono e PC. La chiusura della scheda con modifiche non salvate richiede conferma. Il PDF demo usa i dati già salvati e va generato dopo aver salvato le modifiche.

### Verifica

`npm test` esegue i test di persistenza, compatibilità, modifica, campi sconosciuti, consumo zero, errore di scrittura e conflitti tra schede. Il workflow Pages esegue i test prima di compilare e pubblicare. I dati dei test sono esclusivamente esempi fittizi.
