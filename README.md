# Laurea, all’ultimo minuto

Un piccolo ricordo della festa: tre giochi 2D per browser mobile, con tema scuro, font monospace e grafica geometrica essenziale. Font BigBlue TerminalPlus di VileR incluso senza modifiche nell’app (CC BY-SA 4.0, licenza in `static/fonts/LICENSE.txt`, [fonte originale](https://int10h.org/blog/2015/12/bigblue-terminal-oldschool-fixed-width-font/)), nessun servizio di font esterno e niente decorazioni: un menu di link numerati e giochi a tutto schermo, con punteggio e comandi sovrapposti.

I giochi occupano tutta l’area disponibile nel browser, senza colonne o scroll della pagina. Sui telefoni alti il campo si estende in verticale; un cambio di orientamento ridimensiona la scena senza tagliare gli oggetti o azzerare la partita. La barra del browser rimane sotto il controllo del browser stesso.

BigBlue ha una griglia nativa di 8×12 pixel: il testo usa corpi di 12 o 24 pixel, senza grassetto sintetico. Il canvas segue la densità del display (fino a 3×) e le texture del testo sono rasterizzate alla scala effettiva della camera, per evitare di ingrandire scritte a bassa risoluzione. Il ridimensionamento mantiene corretti anche i controlli touch.

## I QR già stampati

- `/g/1`: **Flappy Laurea**, tap o Spazio per saltare. Vinci a 12 CFU.
- `/g/2`: **La corsa alla laurea**, tre corsie, swipe, pulsanti o frecce. Vinci a 180 punti; i caffè valgono +10, gli ostacoli costano una delle tre vite.
- `/g/3`: **Taglia la sessione**, trascina per tagliare torte, cappelli e confetti. Esami e codice rossi non vanno tagliati. Tre vite, vittoria a 200 punti.
- `/`: menu comune. Tutte le pagine sono raggiungibili direttamente, senza passare dalla home.

Alla vittoria il gioco si ferma: puoi terminare e salvare o continuare nella modalità infinita. Anche dalla pausa puoi terminare volontariamente e salvare il risultato. Quando perdi, puoi inserire un soprannome facoltativo, riprovare, vedere la classifica o tornare al menu. La classifica mostra i migliori 20 risultati per gioco; i tentativi restano separati anche se hanno lo stesso nome. A parità di punti passa davanti chi ha salvato per primo.

## Sviluppo

Stack: Svelte 5 / SvelteKit con adapter-node, TypeScript, Phaser 3 e SQLite integrato in **Node 24**. Nessun account, analytics, font esterno o servizio cloud.

```sh
nix develop
pnpm install --frozen-lockfile
pnpm dev
```

In alternativa: Node >= 24 e pnpm 12. Il server di sviluppo ascolta su `0.0.0.0:5173`, anche per prove dal telefono nella stessa rete, se il firewall lo consente.

```sh
pnpm check
pnpm test
pnpm build
HOST=127.0.0.1 PORT=3000 ORIGIN=http://localhost:3000 pnpm start
```

I test coprono punteggi, collisioni, vite, swipe, prosecuzione oltre il traguardo, isolamento delle classifiche, ordinamento, input non validi, riuso dei biglietti di partita e persistenza del database.

## Server e dati

Seguendo l’impostazione di `../ff`, la flake fornisce shell di sviluppo e pacchetto eseguibile:

```sh
nix build
DATABASE_PATH=/percorso/scrivibile/laurea.sqlite \
  HOST=127.0.0.1 PORT=3000 ORIGIN=https://laurea.example.org \
  ./result/bin/laurea
```

`DATABASE_PATH` predefinito: `data/laurea.sqlite`, relativo alla directory di lavoro. Il database viene creato automaticamente al primo uso della classifica. Il processo deve poter scrivere anche nella cartella che lo contiene, per i file WAL e SHM di SQLite. Una sola istanza Node è sufficiente.

Per il futuro servizio NixOS: usare una `StateDirectory=laurea` e impostare `DATABASE_PATH=/var/lib/laurea/laurea.sqlite`. Conservare quella directory tra i riavvii e gli aggiornamenti; non metterla nel Nix store o in una directory temporanea. Per un backup semplice, fermare il servizio e copiare tutta la directory, oppure usare il comando SQLite `.backup` a servizio attivo.

Il reverse proxy deve inoltrare **tutto il dominio**, incluse `/g/*`, `/api/*` e `/_app/*`. Non servire l’app sotto un prefisso: i QR richiedono esattamente i percorsi indicati. Impostare `ORIGIN` al dominio pubblico HTTPS. Non è stato modificato né distribuito alcun servizio del server.

Il limite richieste è per indirizzo visto da Node ed è volutamente generoso per non bloccare gli invitati sulla stessa Wi-Fi. Per distinguere gli indirizzi dietro un proxy, configurare `ADDRESS_HEADER` / `XFF_DEPTH` di adapter-node **solo con un proxy fidato** che riscrive gli header; non fidarsi degli header inviati direttamente dai visitatori.

## Struttura

- `src/lib/games/catalog.ts`: nomi, testi e obiettivi.
- `src/lib/games/{flappy,runner,slice}.ts`: regole e stato dei tre giochi, indipendenti dal browser e testabili.
- `src/lib/games/phaser-client.ts`: scena Phaser, rendering delle forme, input e simulazione a passo fisso. Importata solo nel browser, non nel menu.
- `src/lib/components/GameShell.svelte`: schermate di inizio, pausa, vittoria, risultato e invio del nome.
- `src/lib/server/scores.ts`: database, validazione e classifica.
- `src/routes/api/{runs,scores}`: API di avvio partita e risultati.

Il cambio scheda mette in pausa senza riprendere automaticamente. Nessun audio. Perdere la rete non impedisce di iniziare una partita locale, ma quel tentativo non può entrare in classifica. I nickname pubblici vengono mostrati come testo, mai come HTML.

## Limiti della prima bozza

- I punteggi sono calcolati sul client: biglietti monouso, limiti alla frequenza e controlli di plausibilità riducono gli abusi banali, **non costituiscono un sistema anti-cheat**. I biglietti scadono dopo 24 ore; gli IP non sono salvati nel database.
- Nessuna autenticazione del nickname o moderazione integrata. Usare un soprannome non sensibile; prima di pubblicare decidere durata di conservazione e modalità di cancellazione dei punteggi.
- Difficoltà e durata sono da rifinire giocando su telefoni reali. La grafica è volutamente semplice: niente sprite complessi o asset da caricare.
- Restano da scegliere dominio e configurazione definitiva del deployment, e da fare una prova su Safari/iPhone reale.
