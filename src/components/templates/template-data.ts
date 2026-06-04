/**
 * Tirol / DACH content templates.
 *
 * These are opinionated starting-point texts for common vacation-rental guide
 * sections in Austria/Germany (DACH). Every municipality has its own rules, so
 * hosts MUST review and adapt the content before publishing.
 *
 * Content lives here — in the templates module — and must NOT be moved to
 * shared constants. It is intentionally verbose so hosts can edit it.
 */

import type { SectionType } from "@prisma/client";

export interface TemplateContent {
  /** The section type this template maps to. */
  sectionType: SectionType;
  /** Short, human-readable key used as the identifier. */
  key: string;
  /** Display name shown in the card header. */
  title: string;
  /** One-line description used in the card. */
  description: string;
  /** Lucide icon name. */
  icon: string;
  /** Colour class for the icon badge. */
  iconColour: string;
  /** Category label for visual grouping. */
  category: string;
  /** German (primary DACH locale) guide content. */
  contentDE: string;
  /** English translation of the guide content. */
  contentEN: string;
  /** German title for the GuideSection. */
  titleDE: string;
  /** English title for the GuideSection. */
  titleEN: string;
}

/** All DACH/Tirol starting-point templates. */
export const TIROL_TEMPLATES: TemplateContent[] = [
  // ── Waste separation ────────────────────────────────────────────────────────
  {
    key: "waste-separation",
    sectionType: "TRASH",
    title: "Waste Separation (Mülltrennung)",
    description:
      "Guide guests through the Austrian / Tirolean multi-bin recycling system.",
    icon: "Trash2",
    iconColour: "bg-green-100 text-green-700",
    category: "House rules",
    titleDE: "Mülltrennung",
    titleEN: "Waste Separation",
    contentDE: `## Mülltrennung in Tirol

Bitte helfen Sie uns, die Umwelt zu schützen und trennen Sie den Müll in die vorgesehenen Behälter.

**Restmüll (grauer/schwarzer Behälter)**
Alles, was nicht recycelt werden kann: Windeln, Hygieneartikel, verschmutztes Papier, Asche (kalt!).

**Papier & Karton (blauer Behälter / Bündeln)**
Zeitungen, Kataloge, Kartons (zusammenfalten). Kein beschichtetes Papier, keine Pizzakartons mit Fettrückständen.

**Gelber Sack / Leichtverpackungen**
Kunststoffverpackungen, Dosen, Tetrapaks. Bitte leer und trocken.

**Altglas (Glascontainer beim Sammelzentrum)**
Flaschen und Gläser nach Farbe trennen: weiß, braun, grün. Bitte keine Deckel, kein Porzellan.

**Biomüll (brauner Behälter)**
Essensreste, Kaffeesatz, Teebeutel, Eierschalen, Obst- und Gemüsereste. Kein Fleisch, keine gekochten Speisen in manchen Gemeinden – bitte lokale Vorschrift beachten.

**Sondermüll (Problemstoffe)**
Batterien, Farben, Medikamente → bitte im Sammelzentrum abgeben, **nicht** in den Hausmüll.

**Leerungstermine** sind am Kalender in der Schublade unter dem Herd notiert.

> Hinweis: Die genauen Regeln variieren je nach Gemeinde. Bitte kontaktieren Sie uns bei Fragen.`,
    contentEN: `## Waste Separation in Tirol

Please help us protect the environment and sort your waste into the correct bins.

**Residual waste (grey/black bin)**
Everything that cannot be recycled: nappies, hygiene products, dirty paper, ash (cooled!).

**Paper & cardboard (blue bin / bundles)**
Newspapers, catalogues, cardboard boxes (fold flat). No coated paper, no greasy pizza boxes.

**Yellow bag / lightweight packaging**
Plastic packaging, cans, Tetra Paks. Please empty and dry before disposal.

**Glass (glass containers at the collection centre)**
Sort by colour: white, brown, green. No lids, no ceramic.

**Organic waste (brown bin)**
Food scraps, coffee grounds, tea bags, eggshells, fruit and vegetable peelings. No meat or cooked meals in some municipalities – please check local rules.

**Hazardous waste**
Batteries, paint, medication → take to the collection centre. Do **not** put in household bins.

**Collection days** are noted on the calendar in the drawer under the stove.

> Note: Exact rules vary by municipality. Please contact us if you have any questions.`,
  },

  // ── Quiet hours ─────────────────────────────────────────────────────────────
  {
    key: "quiet-hours",
    sectionType: "QUIET_HOURS",
    title: "Quiet Hours (Ruhezeiten)",
    description:
      "Austrian statutory quiet hours plus typical house rules for Tirolean properties.",
    icon: "Moon",
    iconColour: "bg-indigo-100 text-indigo-700",
    category: "House rules",
    titleDE: "Ruhezeiten",
    titleEN: "Quiet Hours",
    contentDE: `## Ruhezeiten

Bitte respektieren Sie die gesetzlichen Ruhezeiten sowie die Hausordnung, damit alle Nachbarn ungestört schlafen können.

**Nachtruhe:** 22:00 – 06:00 Uhr
**Mittagsruhe:** 13:00 – 15:00 Uhr
**Sonntagsruhe:** den ganzen Sonntag gilt erhöhte Rücksichtnahme

Während dieser Zeiten bitten wir Sie:
- Musik und Lautstärke auf ein Minimum zu reduzieren
- Türen und Fenster leise zu schließen
- Auf Balkon oder Terrasse leise zu sprechen
- Keine lauten Aktivitäten im Treppenhaus

**Wichtig:** In Österreich sind Ruhestörungen nach § 81 SPG strafbar. Bei wiederholten Verstößen müssen wir leider die Vermietung beenden.

Bei Veranstaltungen oder besonderen Anlässen sprechen Sie uns bitte vorher an.`,
    contentEN: `## Quiet Hours

Please respect the statutory quiet hours and house rules so all neighbours can sleep undisturbed.

**Night quiet hours:** 10:00 pm – 6:00 am
**Afternoon quiet hours:** 1:00 pm – 3:00 pm
**Sunday:** increased consideration is expected throughout the day

During these periods, please:
- Keep music and noise to a minimum
- Close doors and windows quietly
- Speak softly on balconies or terraces
- Avoid loud activity in stairwells

**Important:** In Austria, causing a noise nuisance is a punishable offence under § 81 SPG. Repeated violations may unfortunately require us to terminate the rental.

If you are planning a gathering or special occasion, please let us know in advance.`,
  },

  // ── Guest card (Gästekarte) ──────────────────────────────────────────────────
  {
    key: "gaestekarte",
    sectionType: "CUSTOM",
    title: "Guest Card (Gästekarte)",
    description:
      "Explains the Tirol Guest Card and how to activate free public transport and benefits.",
    icon: "HelpCircle",
    iconColour: "bg-sky-100 text-sky-700",
    category: "Local info",
    titleDE: "Gästekarte Tirol",
    titleEN: "Tirol Guest Card",
    contentDE: `## Ihre Gästekarte Tirol

Als unser Gast erhalten Sie nach der Anmeldung beim Tourismusbüro eine **Gästekarte**, die Ihnen zahlreiche Vorteile bietet.

**Was ist die Gästekarte?**
Die Gästekarte ist ein kostenloser Service für alle Gäste, die in einer meldepflichtigen Unterkunft übernachten und die Kurtaxe bezahlen.

**Ihre Vorteile auf einen Blick:**
- Kostenlose Nutzung des öffentlichen Nahverkehrs (je nach Region: VVT-Busse, Regionalzüge)
- Ermäßigungen bei Bergbahnen, Museen, Freizeiteinrichtungen und Bädern
- Freier Eintritt zu ausgewählten Sehenswürdigkeiten
- Rabatte bei Partnerbetrieben

**So erhalten Sie Ihre Karte:**
1. Reichen Sie Ihren Reisepass oder Personalausweis bei der Anmeldung ein
2. Wir melden Sie bei der Gemeinde an
3. Sie erhalten Ihre Gästekarte automatisch (digital oder als Karte)

> Hinweis: Das genaue Leistungspaket variiert je nach Tourismusverband und Jahreszeit. Aktuelle Infos erhalten Sie unter [www.tirol.at](https://www.tirol.at).`,
    contentEN: `## Your Tirol Guest Card

As our guest, after registering with the tourist office you will receive a **Guest Card** that provides a wide range of benefits.

**What is the Guest Card?**
The Guest Card is a free service for all guests staying in accommodation subject to registration who pay the tourist tax (Kurtaxe).

**Your benefits at a glance:**
- Free use of local public transport (depending on region: VVT buses, regional trains)
- Discounts on cable cars, museums, leisure facilities and swimming pools
- Free entry to selected attractions
- Discounts at partner businesses

**How to get your card:**
1. Present your passport or national ID at check-in
2. We will register you with the municipality
3. You will automatically receive your Guest Card (digital or physical)

> Note: The exact range of services varies by tourist association and season. Current information is available at [www.tirol.at](https://www.tirol.at).`,
  },

  // ── Public transport ─────────────────────────────────────────────────────────
  {
    key: "public-transport",
    sectionType: "PUBLIC_TRANSPORT",
    title: "Public Transport (Öffentlicher Nahverkehr)",
    description:
      "VVT bus and train network, app downloads, and ticketing for Tirol guests.",
    icon: "TrainFront",
    iconColour: "bg-orange-100 text-orange-700",
    category: "Getting around",
    titleDE: "Öffentlicher Nahverkehr",
    titleEN: "Public Transport",
    contentDE: `## Öffentlicher Nahverkehr in Tirol

Tirol hat ein gut ausgebautes Netz aus Bussen und Zügen. Mit Ihrer Gästekarte fahren viele Linien kostenlos!

**Verbund Verkehrsverbund Tirol (VVT)**
Alle Busse und Regionalbahnen im VVT-Verbund. Tickets und Fahrpläne auf der VVT-App oder unter [vvt.at](https://www.vvt.at).

**Nächste Haltestelle:** [Haltestelle eintragen – ca. X Minuten zu Fuß]

**Wichtige Linien von hier:**
- Linie [X] → Ortszentrum / Bahnhof (alle 30 Min, Mo–Sa)
- Linie [X] → Skigebiet [Name] (Wintersaison, stündlich)
- Regionalzug → Innsbruck (vom Bahnhof [Name], ca. X Min)

**Bezahlen & Tickets:**
- Mit Gästekarte: viele Linien gratis im Tarifgebiet
- Einzelticket: am Automaten, in der App oder beim Fahrer
- Tageskarte: € [X] – erhältlich an allen Bahnhöfen

**Nachtbusse** verkehren freitags und samstags bis ca. 02:00 Uhr.

> Aktuelle Fahrpläne immer in der VVT-App prüfen.`,
    contentEN: `## Public Transport in Tirol

Tirol has an excellent network of buses and trains. With your Guest Card, many lines are free!

**Verkehrsverbund Tirol (VVT)**
All buses and regional trains in the VVT network. Tickets and timetables via the VVT app or at [vvt.at](https://www.vvt.at).

**Nearest stop:** [Enter stop name – approx. X minutes' walk]

**Key lines from here:**
- Line [X] → Town centre / train station (every 30 min, Mon–Sat)
- Line [X] → Ski resort [Name] (winter season, hourly)
- Regional train → Innsbruck (from [Name] station, approx. X min)

**Paying & tickets:**
- With Guest Card: many lines are free within the fare zone
- Single ticket: at the machine, in the app, or from the driver
- Day pass: € [X] – available at all stations

**Night buses** run on Fridays and Saturdays until approx. 2:00 am.

> Always check current timetables in the VVT app.`,
  },

  // ── Ski bus ──────────────────────────────────────────────────────────────────
  {
    key: "ski-bus",
    sectionType: "PUBLIC_TRANSPORT",
    title: "Ski Bus",
    description:
      "Seasonal shuttle service to the ski lifts — routes, times, and booking.",
    icon: "TrainFront",
    iconColour: "bg-blue-100 text-blue-700",
    category: "Getting around",
    titleDE: "Skibus",
    titleEN: "Ski Bus",
    contentDE: `## Skibus

Der Skibus bringt Sie bequem und stressfrei direkt zu den Skiliften – kein Parkplatzsuchen notwendig!

**Saison:** ca. Dezember bis April (abhängig von der Schneelage)

**Abfahrt in Ihrer Nähe:** [Haltestelle eintragen]
**Erster Bus:** [Uhrzeit], **Letzter Bus retour:** [Uhrzeit]

**Fahrplan:**
| Abfahrt | Ankunft Tal | Ankunft Berg |
|---------|-------------|--------------|
| [Zeit]  | [Zeit]      | [Zeit]       |

**Kosten:**
- Mit Gästekarte: kostenlos (bitte Karte vorzeigen)
- Ohne Gästekarte: Tageskarte € [X] / Wochenkarte € [X]

**Tipp:** Buchen Sie Ski-Verleihe und Liftkarten online im Voraus – das spart Zeit und oft auch Geld.

**Skidepot:** Ein abschließbares Skidepot steht Ihnen direkt neben dem Eingang zur Verfügung (Schlüssel im Schlüsselschrank).

> Abfahrtszeiten können saisonal variieren. Bitte den aktuellen Aushang an der Haltestelle beachten.`,
    contentEN: `## Ski Bus

The ski bus takes you comfortably and stress-free directly to the ski lifts – no parking hassles!

**Season:** approximately December to April (depending on snow conditions)

**Nearest stop:** [Enter stop name]
**First bus:** [time], **Last return bus:** [time]

**Timetable:**
| Departure | Valley arrival | Mountain arrival |
|-----------|----------------|------------------|
| [time]    | [time]         | [time]           |

**Cost:**
- With Guest Card: free (please show card)
- Without Guest Card: day pass € [X] / week pass € [X]

**Tip:** Book ski rental and lift passes online in advance – it saves time and often money.

**Ski storage:** A lockable ski storage room is available just next to the entrance (key in the key safe).

> Departure times may vary seasonally. Please check the current notice at the stop.`,
  },

  // ── Parking rules ────────────────────────────────────────────────────────────
  {
    key: "parking-rules",
    sectionType: "PARKING",
    title: "Parking Rules (Parkregeln)",
    description:
      "Designated parking, permit zones, and winter tyre regulations for Tirol.",
    icon: "ParkingCircle",
    iconColour: "bg-slate-100 text-slate-700",
    category: "Arrival",
    titleDE: "Parken",
    titleEN: "Parking",
    contentDE: `## Parken

**Ihr Stellplatz:** [Beschreibung des Stellplatzes – z. B. Parkplatz Nr. 5 links neben dem Eingang]

**Adresse / Wie Sie ihn finden:**
[Kurzbeschreibung oder Google-Maps-Link einfügen]

**Wichtige Hinweise:**
- Bitte parken Sie **ausschließlich** auf dem zugewiesenen Platz
- Für Gäste sind **[Anzahl] Stellplätze** kostenlos reserviert
- Das Fahrzeug bitte mit der **Parkscheibe** abstellen (Parkscheibe im Handschuhfach)

**Blaue Zone / Kurzparkzone in der Gemeinde:**
Im Ortskern gilt eine kostenpflichtige Kurzparkzone von 09:00–18:00 Uhr (Mo–Fr). Tagestickets (€ [X]) erhalten Sie im Tourismusbüro oder an den Automaten.

**Winterreifenpflicht (Oktober–April):**
In Österreich besteht bei winterlichen Verhältnissen **situative Winterreifenpflicht**. Bei Schnee oder Eis können Fahrzeuge ohne Winterreifen / Schneeketten stillgelegt werden.

**Anhänger / Wohnmobile:** Bitte vor der Anreise Rücksprache halten.

> Bei Schneeräumung müssen Fahrzeuge bis spätestens 07:00 Uhr vom Räumbereich weggestellt werden (Hinweisschild beachten).`,
    contentEN: `## Parking

**Your parking space:** [Description – e.g. Space No. 5 left of the entrance]

**Address / How to find it:**
[Short description or Google Maps link]

**Important notes:**
- Please park **only** in your assigned space
- **[Number] spaces** are reserved free of charge for guests
- Display a **parking disc** on the dashboard (disc in the glove box)

**Blue zone / short-stay zone in the village:**
The town centre has a paid short-stay zone from 9:00 am–6:00 pm (Mon–Fri). Day tickets (€ [X]) are available from the tourist office or parking meters.

**Winter tyre requirement (October–April):**
Austria has a **situational winter tyre obligation**: vehicles without winter tyres or snow chains can be immobilised in wintry conditions (snow or ice).

**Trailers / motorhomes:** Please check with us before arrival.

> During snow clearance, vehicles must be moved from the clearance area by 7:00 am at the latest (observe signage).`,
  },

  // ── Emergency numbers ────────────────────────────────────────────────────────
  {
    key: "emergency-numbers",
    sectionType: "SAFETY",
    title: "Emergency Numbers (Notrufnummern)",
    description:
      "Austrian emergency contacts, mountain rescue, and local out-of-hours services.",
    icon: "ShieldAlert",
    iconColour: "bg-red-100 text-red-700",
    category: "Safety",
    titleDE: "Notrufnummern & Sicherheit",
    titleEN: "Emergency Numbers & Safety",
    contentDE: `## Notrufnummern

Im Notfall zögern Sie nicht, den richtigen Dienst sofort zu verständigen.

| Dienst | Nummer |
|--------|--------|
| **Notruf Polizei** | **133** |
| **Feuerwehr** | **122** |
| **Rettungsdienst / Notarzt** | **144** |
| **Europäischer Notruf** | **112** |
| **Bergrettung (Tirol)** | **140** |
| **Ärztlicher Bereitschaftsdienst** | **141** |
| **Vergiftungsnotruf (Wien)** | **01 406 43 43** |

**Nächste Unfallambulanz:**
[Name und Adresse des nächsten Krankenhauses eintragen]

**Unser Notfallkontakt:**
Tel.: [Ihre Handynummer]
E-Mail: [Ihre E-Mail]

**Sicherheitsausstattung in der Unterkunft:**
- Feuerlöscher: [Standort, z. B. Küche neben der Tür]
- Erste-Hilfe-Kasten: [Standort, z. B. Bad unter dem Waschbecken]
- CO-Melder: [Standort]
- Feuermelder: in jedem Stockwerk

**Verhalten im Brandfall:**
1. Haus sofort verlassen – Aufzug **nicht** benutzen
2. Tür hinter sich schließen
3. Feuerwehr rufen: **122**
4. Sammelplatz: [Beschreibung, z. B. Parkplatz vor dem Haus]`,
    contentEN: `## Emergency Numbers

In an emergency, do not hesitate to contact the right service immediately.

| Service | Number |
|---------|--------|
| **Police emergency** | **133** |
| **Fire brigade** | **122** |
| **Ambulance / emergency doctor** | **144** |
| **European emergency** | **112** |
| **Mountain rescue (Tirol)** | **140** |
| **Medical on-call service** | **141** |
| **Poison control centre (Vienna)** | **01 406 43 43** |

**Nearest A&E / hospital:**
[Enter name and address of the nearest hospital]

**Our emergency contact:**
Phone: [Your mobile number]
Email: [Your email]

**Safety equipment in the accommodation:**
- Fire extinguisher: [Location – e.g. kitchen next to the door]
- First-aid kit: [Location – e.g. bathroom under the sink]
- CO detector: [Location]
- Smoke detectors: on every floor

**In case of fire:**
1. Leave the building immediately – do **not** use the lift
2. Close the door behind you
3. Call the fire brigade: **122**
4. Assembly point: [Description – e.g. car park in front of the building]`,
  },

  // ── Pharmacy & doctor ────────────────────────────────────────────────────────
  {
    key: "pharmacy-doctor",
    sectionType: "PHARMACY",
    title: "Pharmacy & Doctor (Apotheke & Arzt)",
    description:
      "Local pharmacy, GP, and out-of-hours medical services nearby.",
    icon: "Pill",
    iconColour: "bg-pink-100 text-pink-700",
    category: "Local info",
    titleDE: "Apotheke & Arzt",
    titleEN: "Pharmacy & Doctor",
    contentDE: `## Apotheke & Arzt

**Nächste Apotheke:**
[Name der Apotheke]
[Adresse]
Öffnungszeiten: [z. B. Mo–Fr 08:00–18:00, Sa 09:00–12:00]
Tel.: [Telefonnummer]

**Nachtdienstapotheke / Bereitschaftsapotheke:**
Die diensthabende Apotheke finden Sie unter [aponet.at](https://www.aponet.at) oder durch Anruf bei einer geschlossenen Apotheke (Aushang an der Tür).

**Allgemeinarzt / Hausarzt:**
[Name des Arztes]
[Adresse & Sprechzeiten]
Tel.: [Telefonnummer]
Termine bitte telefonisch oder online buchen.

**Ärztlicher Bereitschaftsdienst (außerhalb der Öffnungszeiten):**
Rufnummer: **141** (österreichweit)
Verfügbar: täglich 19:00–07:00 Uhr und an Wochenenden/Feiertagen ganztags

**Nächstes Krankenhaus / Unfallambulanz:**
[Name, Adresse und Entfernung eintragen]

**TIPP:** Für leichtere Beschwerden bieten viele Apotheken eine kostenlose Erstberatung an.`,
    contentEN: `## Pharmacy & Doctor

**Nearest pharmacy:**
[Pharmacy name]
[Address]
Opening hours: [e.g. Mon–Fri 8:00 am–6:00 pm, Sat 9:00 am–12:00 pm]
Phone: [Phone number]

**Night duty / on-call pharmacy:**
Find the duty pharmacy at [aponet.at](https://www.aponet.at) or by calling a closed pharmacy (notice on the door).

**General practitioner / GP:**
[Doctor's name]
[Address & surgery hours]
Phone: [Phone number]
Please book appointments by phone or online.

**Out-of-hours medical service:**
Phone: **141** (Austria-wide)
Available: daily 7:00 pm–7:00 am and all day on weekends/public holidays

**Nearest hospital / A&E:**
[Enter name, address and distance]

**TIP:** Many pharmacies offer free initial advice for minor complaints.`,
  },

  // ── Tourist tax reminder ─────────────────────────────────────────────────────
  {
    key: "tourist-tax",
    sectionType: "CUSTOM",
    title: "Tourist Tax (Kurtaxe / Ortstaxe)",
    description:
      "Explains the mandatory Kurtaxe, how it is collected, and what it funds.",
    icon: "ScrollText",
    iconColour: "bg-yellow-100 text-yellow-700",
    category: "House rules",
    titleDE: "Kurtaxe / Ortstaxe",
    titleEN: "Tourist Tax",
    contentDE: `## Kurtaxe

Die Kurtaxe (auch Ortstaxe) ist eine gesetzlich vorgeschriebene Abgabe, die für jeden Übernachtungsgast zu entrichten ist. Sie fließt direkt in die touristische Infrastruktur Ihrer Gemeinde.

**Betrag:** € [X,XX] pro Person und Nacht
*(Kinder unter [Alter] Jahre sind befreit – bitte beim Anreisen angeben.)*

**Wann und wie wird sie gezahlt?**
- Bei der **Anmeldung** zu Beginn Ihres Aufenthalts
- Zahlung: [z. B. Bar, Überweisung, Kartenzahlung an der Rezeption / wird über die Buchungsplattform abgerechnet]

**Wofür wird die Kurtaxe verwendet?**
- Pflege und Instandhaltung von Wanderwegen und Skipisten
- Kulturelle Veranstaltungen und Attraktionen
- Tourismusbüro und Gästeservice
- Gästekarte und deren Leistungen

**Meldepflicht:**
Als Vermieter sind wir verpflichtet, alle Gäste bei der Gemeinde anzumelden. Dafür benötigen wir ein gültiges Ausweisdokument (Reisepass oder Personalausweis) aller Gäste über [Alter].

> Die genaue Höhe der Kurtaxe wird jährlich von der Gemeinde festgelegt und kann sich von Ort zu Ort unterscheiden.`,
    contentEN: `## Tourist Tax (Kurtaxe)

The tourist tax (Kurtaxe or Ortstaxe) is a legally required levy payable for every overnight guest. It flows directly into the tourism infrastructure of your municipality.

**Amount:** € [X.XX] per person per night
*(Children under [age] years are exempt – please advise us on arrival.)*

**When and how is it paid?**
- On **check-in** at the start of your stay
- Payment: [e.g. cash, bank transfer, card payment at reception / charged via the booking platform]

**What is the tourist tax used for?**
- Maintenance of hiking trails and ski slopes
- Cultural events and attractions
- Tourist office and guest services
- Guest Card and its benefits

**Registration requirement:**
As landlords we are legally required to register all guests with the municipality. For this we need a valid ID document (passport or national ID card) for all guests over [age].

> The exact tourist tax rate is set annually by the municipality and may vary by location.`,
  },

  // ── House rules ──────────────────────────────────────────────────────────────
  {
    key: "house-rules",
    sectionType: "HOUSE_RULES",
    title: "House Rules (Hausordnung)",
    description:
      "Standard Tirolean vacation-rental house rules covering guests, behaviour, and check-out.",
    icon: "ScrollText",
    iconColour: "bg-amber-100 text-amber-700",
    category: "House rules",
    titleDE: "Hausordnung",
    titleEN: "House Rules",
    contentDE: `## Hausordnung

Willkommen in unserem Ferienhaus! Wir möchten, dass Sie sich wohlfühlen und bitten Sie, folgende Regeln zu respektieren.

### Gäste & Belegung
- Die maximale Belegung beträgt **[Anzahl] Personen**
- Nicht angemeldete Übernachtungsgäste sind nicht erlaubt
- Haustiere nur nach vorheriger Absprache (Aufpreis: € [X]/Nacht)

### Rauchen
- **Rauchen ist im gesamten Haus nicht gestattet**, einschließlich Balkon
- Bitte nutzen Sie den ausgewiesenen Bereich [Beschreibung] außerhalb des Gebäudes

### Ruhezeiten
- Nachtruhe: 22:00–06:00 Uhr
- Mittagsruhe: 13:00–15:00 Uhr
- Partys und lautere Veranstaltungen sind nicht gestattet

### Reinigung & Ordnung
- Bitte hinterlassen Sie das Haus in einem ordentlichen Zustand
- Spülen Sie das Geschirr ab oder stellen Sie es in die Spülmaschine
- Entsorgen Sie alle Lebensmittel und leeren Sie den Kühlschrank

### Schlüssel & Sicherheit
- Haustür immer abschließen, wenn Sie das Haus verlassen
- Schlüsselverlust kostet € [X] (Schlosstausch)
- Bei Schlüsselabgabe bitte alle [Anzahl] Schlüssel zurückgeben

### Schäden & Haftung
- Bitte melden Sie Schäden sofort unter [Telefonnummer]
- Vorsätzlich verursachte Schäden werden in Rechnung gestellt
- Wir haften nicht für Wertsachen, die nicht im Tresor aufbewahrt werden

### Check-out
- Abreise bis **[Uhrzeit]** Uhr
- [Checkoutanweisungen eintragen: Schlüssel, Fenster, Heizung etc.]

Wir wünschen Ihnen einen wunderschönen Aufenthalt!`,
    contentEN: `## House Rules

Welcome to our holiday home! We want you to feel comfortable and ask you to respect the following rules.

### Guests & occupancy
- Maximum occupancy: **[number] persons**
- Unregistered overnight guests are not permitted
- Pets by prior arrangement only (surcharge: € [X]/night)

### Smoking
- **Smoking is not permitted anywhere in the property**, including the balcony
- Please use the designated area [description] outside the building

### Quiet hours
- Night quiet hours: 10:00 pm–6:00 am
- Afternoon quiet hours: 1:00 pm–3:00 pm
- Parties and loud gatherings are not permitted

### Cleanliness & tidiness
- Please leave the property in a tidy condition
- Wash up or load dishes into the dishwasher
- Remove all food and empty the fridge

### Keys & security
- Always lock the front door when leaving the property
- Lost key charge: € [X] (lock replacement)
- Please return all [number] keys on check-out

### Damage & liability
- Report any damage immediately to [phone number]
- Intentional damage will be charged
- We are not liable for valuables not stored in the safe

### Check-out
- Departure by **[time]**
- [Enter check-out instructions: keys, windows, heating, etc.]

We wish you a wonderful stay!`,
  },
];

/** Look up a template by its string key. */
export function getTemplate(key: string): TemplateContent | undefined {
  return TIROL_TEMPLATES.find((t) => t.key === key);
}

/** Group templates by category for display. */
export function getTemplatesByCategory(): Record<string, TemplateContent[]> {
  const groups: Record<string, TemplateContent[]> = {};
  for (const t of TIROL_TEMPLATES) {
    if (!groups[t.category]) groups[t.category] = [];
    groups[t.category].push(t);
  }
  return groups;
}
