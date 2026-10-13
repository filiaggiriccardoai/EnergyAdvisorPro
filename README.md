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

Dalla versione 0.3.0, profili e associazioni clienti sono salvati nella chiave `energy-advisor-pro:workspace:v2`, nel profilo del browser o di Electron. La chiave precedente `energy-advisor-pro:clients:v1` rimane intatta come copia dell’archivio prima della migrazione. Nessun backend, sincronizzazione o font remoto. Cancellare il profilo o i dati del browser elimina l'archivio. I dati non sono cifrati: questa versione è una base dimostrativa, da consolidare prima dell'uso con dati personali reali. Per la versione professionale prevedere SQLite tramite API Electron limitata, backup/ripristino, migrazioni, validazione e protezione dei dati.

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

## Profili consulente (0.3.0)

Apri **Gestisci profili** nella barra superiore (anche da smartphone). Il consulente iniziale è **Consulente principale**, con dati anagrafici vuoti. Scegli **Modifica**, inserisci nome, cognome, azienda, telefono, email, indirizzo e, se disponibile, partita IVA. Il campo logo accetta PNG/JPEG/WebP fino a 2 MB; l'immagine viene ridimensionata localmente a un massimo di 320 pixel e salvata nell'archivio. SVG e URL remoti non sono accettati. Nome, cognome o azienda sono necessari per riconoscere un nuovo profilo; gli altri campi sono facoltativi.

**Nuovo profilo** crea un altro consulente con archivio vuoto. Il profilo appena salvato diventa attivo. Il selettore **Consulente attivo** o il pulsante **Usa profilo** cambiano l'archivio visualizzato: dashboard, conteggi, ricerca e lista clienti si riferiscono al consulente selezionato. I nuovi clienti sono associati automaticamente al consulente attivo. Nella scheda cliente puoi modificare **Consulente associato**; il salvataggio chiede conferma per spostare un cliente esistente in un altro archivio. Il cliente conserva ID, note e dati tecnici.

I profili locali non sono account e non costituiscono autenticazione o isolamento di sicurezza. Chi accede allo stesso browser può scegliere qualunque profilo. Non sono presenti password, servizi cloud o sincronizzazione tra dispositivi. Profili e loghi restano nel localStorage; nessun dato personale viene inviato al repository GitHub.

### Conservazione e migrazione

Al primo avvio della versione 0.3.0 tutti i clienti della versione precedente vengono copiati nel nuovo archivio e associati al consulente principale. La chiave originale resta invariata, compresi i suoi byte JSON; si preservano anche dettagli e proprietà aggiuntive dei clienti. Un archivio precedente vuoto resta vuoto. La migrazione scrive il nuovo archivio in un'unica operazione e non si ripete se già completata. Se non c'è spazio o l'archivio non è leggibile, le scritture si bloccano e i dati precedenti restano intatti. Le modifiche provenienti da un'altra scheda o dalla vecchia versione non vengono sovrascritte silenziosamente: in quel caso esporta il backup completo prima di procedere.

**Clienti → Esporta archivio** esporta soltanto il consulente attivo e i suoi clienti. **Impostazioni → Esporta backup completo** salva entrambi gli archivi locali come stringhe JSON originali (`workspaceRaw` e `legacyArchiveRaw`), comprendendo tutti i profili, i loghi e i clienti. Il ripristino guidato resta da implementare; conserva il file e non cancellare i dati del browser.

### Preparazione dei report

Il modello `Advisor` e la relazione `Client.advisorId` consentono di inserire i dati del consulente nei documenti futuri. La funzione `reportContext` ricava il consulente associato al cliente, indipendentemente dal profilo attivo. Il preventivo PDF attuale resta dimostrativo.

### Test

`npm test` comprende test di migrazione, conservazione di clienti/dettagli/campi extra, separazione degli archivi, cambio profilo, modifica profilo e logo, trasferimento esplicito del cliente, associazioni valide, quota insufficiente, archivi corrotti e conflitti con schede o versioni precedenti. Le fixture sono esclusivamente fittizie. Il workflow GitHub Pages esegue test e build prima del deploy.

## Catalogo, listini e preventivi (0.4.0)

Apri **Catalogo e listini** per creare un articolo/taglia. Puoi configurare categoria, marca, modello, tipologia, potenza o capacità nominale, unità, quantità proposta, acquisto/vendita, installazione unitaria, sconto e IVA. Le categorie coprono moduli FV, inverter, batterie, pompe di calore, accessori e servizi. Modifica o duplica una riga per un'altra taglia; disattiva gli articoli da non proporre oppure eliminali. Le righe già salvate nei preventivi sono copie e non cambiano quando il catalogo viene modificato.

Il catalogo iniziale contiene soltanto esempi **DEMO**, con marche, modelli e prezzi fittizi, modificabili o eliminabili. Non sono listini ufficiali. Gli articoli restano DEMO finché il consulente non aggiorna e riclassifica esplicitamente i dati. IVA predefinita 22%, modificabile; nessuna aliquota agevolata o incentivo viene presunto.

Apri **Preventivi → Nuovo preventivo**, seleziona un cliente dell'archivio attivo, aggiungi articoli dal catalogo e modifica quantità, prezzi, sconti e IVA. Sono consentite più bozze per cliente. Completa data, validità, note, esclusioni e condizioni; scegli **Salva bozza**. Dopo il salvataggio puoi usare **Anteprima** e **Scarica PDF**. Le bozze persistono dopo la ricarica e si riaprono da **Apri preventivo**. Il cambio pagina o consulente chiede conferma se ci sono modifiche non salvate.

Per pannelli, inverter, batterie e pompe di calore le quantità sono intere, con minimo 1. Accessori e servizi possono usare quantità decimali, con minimo 0,01. I totali di pannelli, kWp, kWh utilizzabili e kW termici sono somme delle taglie selezionate, non dimensionamento tecnico.

### Calcoli e documenti

Prezzi e costi sono al netto dell'IVA. L'installazione configurata è un importo unitario moltiplicato per la quantità: usa questo campo oppure una riga servizio, evitando il doppio conteggio. Lo sconto riga si applica a vendita e installazione; lo sconto generale si applica successivamente. Si arrotonda a centesimi per riga, poi si calcola l'IVA per aliquota. Il margine lordo è ricavo netto meno acquisti e installazione netti; non comprende spese generali o imposte. La percentuale del margine è sul ricavo ed è non applicabile se il ricavo è zero.

Costi e margini sono interni e non compaiono nell'anteprima o nel PDF. Il documento contiene intestazioni consulente/cliente, logo, componenti, quantità, prezzi, sconti, imponibile, IVA, totale, validità e condizioni. Le intestazioni sono copie conservate nella bozza. **Aggiorna intestazione** legge i dati correnti senza cambiare le altre bozze. Se un cliente viene spostato a un altro consulente, le offerte precedenti conservano l'intestazione originale. I PDF hanno marcatura BOZZA; le offerte che includono righe DEMO riportano un avviso esplicito. Testi lunghi proseguono su più pagine.

### Archivi e compatibilità

Catalogo e preventivi usano una chiave separata per consulente: `energy-advisor-pro:commerce:v1:<advisorId>`. Non riscrivono gli archivi clienti/profili o la copia precedente alla migrazione. Il catalogo DEMO viene proposto solo quando la nuova chiave non esiste: un catalogo salvato vuoto non viene ripopolato. Errori di scrittura, archivi corrotti e conflitti tra schede non cancellano dati. **Impostazioni → Esporta backup completo** include anche tutti gli archivi commerciali; l'esportazione del consulente include solo il suo archivio commerciale.

La separazione è locale nell'interfaccia, non autenticazione sicura. Nessun dato personale viene inviato a GitHub. L'archiviazione resta specifica del browser/dispositivo, senza sincronizzazione.

### Verifiche e sviluppi successivi

I test coprono compatibilità e conservazione degli archivi, persistenza e separazione per consulente, più offerte per cliente, indipendenza delle copie dal catalogo, sconti, IVA mista, arrotondamenti, margini, taglie, date e valori non validi, errori di spazio e conflitti, anteprima senza costi interni e PDF multipagina. Build TypeScript/Vite prevista prima del deploy Pages. La verifica completa in Chromium non è stata conclusa nell'ambiente; non è presentata come superata.

Rimangono per le prossime fasi: importazione Excel con mappatura colonne e validazione, versioni/revisioni e accettazione offerte, invio e firma, confronti tra scenari, dimensionamento tecnico e incentivi. Il ripristino guidato dei backup è ancora da implementare.

## Over, provvigioni e contratti (0.5.0)

Il modulo è integrato nella stessa app, con gli stessi clienti, consulenti, cataloghi e preventivi. Non introduce un secondo progetto o account online.

### Regole economiche e prezzi

Le nuove offerte commerciali fotografano regole v1: IVA 10%, provvigione base 10% sul solo minimo netto, provvigione venditore 60% sul solo over netto, quota azienda 40% sull'over netto. L'over di listino è unitario in euro IVA 10% inclusa. Il minimo unitario è netto e comprende l'installazione. Gli importi nuovi sono calcolati con interi BigInt e arrotondamento half-up al centesimo; i valori memorizzati nei contratti sono stringhe di centesimi. L'over netto complessivo è il lordo diviso 1,10, con ripartizione dei centesimi sulle righe per preservare il totale. Le provvigioni base e over vengono arrotondate separatamente; la quota azienda completa la ripartizione dell'over netto.

Esempio verificato: 10.000 euro minimo netto, 2.200 euro over lordo = 2.000 euro over netto; base 1.000 euro, over venditore 1.200 euro, teorica 2.200 euro, quota azienda 800 euro, prezzo cliente IVA inclusa 13.200 euro.

Gli sconti riducono il prezzo cliente. La provvigione teorica segue le formule sul minimo e sull'over inseriti, non un'ulteriore rettifica automatica per sconti. Questo criterio è esplicitamente fotografato come `discountPolicy: quoted-over`; l'importo maturato resta confermato manualmente. Non vengono dedotte automaticamente altre componenti dal compenso.

In **Catalogo e listini**, configura prezzo minimo, obbligatorietà e over lordo. La categoria **Pacchetto** permette di scegliere i componenti inclusi e le quantità. Il prezzo complessivo del pacchetto è manuale: i componenti non vengono inseriti come righe separate né sommati nuovamente. Componenti duplicati tra un pacchetto e un'altra riga/pacchetto bloccano la finalizzazione; per articoli già eliminati dal catalogo rimangono le copie storiche nel preventivo.

Le bozze esistenti non vengono ricalcolate o convertite automaticamente. **Attiva over e provvigioni** applica esplicitamente le regole alla bozza aperta; il salvataggio è manuale. Le nuove offerte usano le regole commerciali e IVA 10%. Il minimo fotografato è visibile internamente e non viene abbassato nel configuratore; per un diverso listino crea/aggiorna l'articolo prima di inserirlo in una nuova offerta.

**Salva bozza** resta disponibile anche sotto minimo. **Finalizza offerta** richiede una bozza salvata, valida, senza violazioni dei minimi obbligatori o doppie righe di pacchetto. I definitivi sono immutabili nell'app: crea una nuova offerta per revisioni. Il PDF definitivo è bloccato per valori non finalizzabili; il PDF bozza mantiene la marcatura BOZZA.

### Gestionale provvigioni

Apri **Gestionale provvigioni → Registra contratto firmato**, scegli un preventivo definitivo e indica la data della firma. Ogni offerta può originare un solo contratto. Cliente, consulente, preventivo e fotografia economica restano collegati e immutabili anche se cambiano listini o anagrafiche. La firma non conferma alcuna maturazione.

- **Incassi azienda:** una riga per tranche, bonifico o finanziaria. Registra importo/data previsti, importo/data effettivi, riferimento e note. Quando arriva la tranche, modifica quella prevista anziché aggiungerla di nuovo. Il saldo cliente usa gli importi realmente incassati rispetto all'importo contrattuale.
- **Imprevisti:** tipo, descrizione, importo, data, stato e impatto da definire. Gli annullati sono esclusi dal totale degli imprevisti confermati; nessun imprevisto modifica automaticamente le provvigioni.
- **Maturazione manuale:** indica totale maturato confermato, data e motivazione. Ogni conferma conserva valore precedente, operatore locale e timestamp. Non somma il nuovo totale ai precedenti. Puoi lasciare aperta la verifica per il residuo teorico oppure chiuderla esplicitamente. Una successiva conferma resta tracciata. Non sono definite automazioni per parziali, saldo, finanziarie o imprevisti.
- **Pagamenti consulente:** importi realmente pagati, date, riferimenti e note; pagamenti parziali e residuo sull'importo confermato. Pagamenti oltre la conferma vengono segnalati e conservati.
- **Stati:** progressione da firma a sopralluogo, installazione, collaudo, completamento, con possibilità di annullamento. Ogni variazione richiede una motivazione. In questa prima versione le retrocessioni e la riapertura di un annullato sono bloccate. L'annullamento non cancella incassi, pagamenti o conferme e non revoca automaticamente compensi.

La dashboard filtra per **data firma**, anno e mese, e usa il consulente selezionato nella barra superiore. Gli importi sono cumulativi dei contratti selezionati, non flussi di cassa del solo mese. Vendite e teoriche escludono gli annullati; incassi, pagamenti e conferme effettivi restano conteggiati. La maturazione da verificare distingue le conferme parziali da quelle esplicitamente chiuse. I riferimenti non vuoti di incassi e pagamenti sono unici per ciascun registro del consulente; operazioni diverse devono avere riferimenti distinti. Le modifiche a una registrazione conservano l'ID e aggiornano il valore, senza sommare una copia. Non è ancora gestita la ripartizione automatica di una transazione su più contratti.

### Riservatezza e archivi

Il renderer cliente usa un elenco esplicito di soli dati pubblici. Prezzi minimi, over separato, acquisti, compensi, regole provvigionali e annotazioni interne non vengono inclusi nell'anteprima, nel contenuto o nei metadati del PDF. I prezzi finali includono naturalmente gli importi applicati al cliente. Note offerta, esclusioni e condizioni sono campi pubblici: non inserirvi informazioni interne.

Il gestionale è dichiarato **interno, non protetto**: localStorage conserva i dati in chiaro, il cambio profilo non è autenticazione, e il registro di modifiche non è certificato né resistente alla manomissione fuori dall'app. Non c'è una password fittizia. La soluzione incrementale futura prevede database desktop cifrato, gestione delle chiavi tramite sistema operativo Windows e accessi/ruoli autentici; non è implementata in questa versione.

I contratti usano `energy-advisor-pro:contracts:v1:<advisorId>` senza riscrivere gli archivi precedenti. I nuovi campi commerciali sono opzionali e compatibili con cataloghi/preventivi 0.4.0. Il caricamento non migra automaticamente né ripopola dati esistenti. Tutti gli archivi sono inclusi nel backup completo; il backup del consulente include anche i suoi contratti. Sono backup interni da non condividere con il cliente. Il ripristino guidato resta futuro.

### Verifiche e prossimi sviluppi

I test coprono l'esempio obbligatorio, conversione/arrotondamenti e ripartizione dei centesimi, conservazione storica, minimi e PDF definitivo, pacchetti, immutabilità dei definitivi, contratti unici, incassi e pagamenti senza duplicati, maturazione non automatica e conferme tracciate, imprevisti non detratti, stati e annullamento, separazione per consulente, errori di spazio/conflitti, dashboard e riservatezza di anteprima/PDF/metadati. La verifica completa Chromium non è stata eseguita in questo incremento.

Restano da sviluppare regole automatiche di maturazione dopo conferma aziendale, rettifiche economiche formalizzate, revisioni/riaperture dei contratti, importazioni listini Excel, ripartizione di operazioni su più contratti, protezione autentica e ripristino guidato. Non viene promessa alcuna di queste funzioni come già disponibile.
