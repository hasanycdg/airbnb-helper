# Test-Deployment auf Hetzner (Docker Compose + nip.io)

Bringt StayGuide Pro auf einen Hetzner-Server, erreichbar per HTTPS über eine
**nip.io**-Adresse — also ohne eine echte Domain zu kaufen. Stack: Postgres +
Next.js-App + Caddy (holt das HTTPS-Zertifikat automatisch).

> **Warum HTTPS Pflicht ist:** Das Login-Cookie wird mit `secure` gesetzt
> (`src/lib/auth.ts`). Über reines `http://<ip>` funktioniert der Login daher
> **nicht** — nip.io + Caddy lösen das.

---

## 1. Server anlegen
- Hetzner Cloud → neuer Server, **Ubuntu 24.04**, Typ **CX22** (2 vCPU / 4 GB) reicht.
- Öffentliche IPv4 notieren, z. B. `203.0.113.9`.
- **Firewall** (Hetzner Cloud Firewall *oder* `ufw`): eingehend **22, 80, 443** erlauben.

Deine Test-Domain ist dann automatisch: **`203.0.113.9.nip.io`** (IP mit Punkten + `.nip.io`).

## 2. Docker installieren
```bash
ssh root@203.0.113.9
curl -fsSL https://get.docker.com | sh
```
(Compose v2 ist im Docker-Paket enthalten — `docker compose version` zum Prüfen.)

## 3. Code holen
```bash
git clone <DEIN-REPO-URL> stayguide && cd stayguide
git checkout claude/friendly-easley-ee03ca   # Branch mit dem Deploy-Setup
```
Kein Git-Remote? Stattdessen lokal `git archive`/`scp` oder `rsync` aufs Server.

## 4. Konfigurieren
```bash
cp .env.deploy.example .env
nano .env
```
Mindestens setzen:
- `DOMAIN=203.0.113.9.nip.io`  ← **deine** Server-IP
- `AUTH_SECRET=` ← `openssl rand -base64 32` ausführen und einsetzen
- `POSTGRES_PASSWORD=` ← ein eigenes Passwort

OpenAI/Resend usw. können leer bleiben (die App nutzt Offline-Fallbacks).

## 5. Starten
```bash
docker compose up -d --build
```
Beim ersten Start: Image-Build → DB-Schema (`prisma db push`) → Demo-Daten
(`SEED_ON_START=true`) → `next start`. Caddy holt im Hintergrund das Zertifikat
(einige Sekunden).

Logs verfolgen:
```bash
docker compose logs -f app caddy
```

## 6. Aufrufen
- **App:** `https://203.0.113.9.nip.io`
- **Login (Seed):** `owner@demo-tirol.test` / `password123`
- **Öffentlicher Gäste-Guide:** `https://203.0.113.9.nip.io/g/city-apartment-innsbruck`

---

## Betrieb

| Aufgabe | Befehl |
|---|---|
| Status | `docker compose ps` |
| Logs | `docker compose logs -f app` |
| Update nach `git pull` | `docker compose up -d --build` |
| Neustart | `docker compose restart app` |
| Stoppen | `docker compose down` |
| **Alles inkl. DB löschen** | `docker compose down -v` |
| Reseed erzwingen | `.env`: `SEED_ON_START=true` → `docker compose up -d` (einmalig), danach wieder auf `false` |

## Troubleshooting
- **Zertifikat kommt nicht / `https` schlägt fehl:** Caddy-Logs prüfen
  (`docker compose logs caddy`). Meist sind Port 80/443 in der Firewall zu, oder
  `DOMAIN` passt nicht zur Server-IP. Let's Encrypt hat zudem geteilte
  Rate-Limits auf `nip.io` — falls's klemmt, eine **DuckDNS**-Subdomain nehmen
  und nur `DOMAIN` in `.env` ändern (Setup bleibt gleich).
- **App startet nicht / DB-Fehler:** `docker compose logs app`. Healthcheck
  wartet auf Postgres; bei „connection refused" einfach `docker compose up -d`
  erneut — die App startet neu, sobald die DB bereit ist.
- **Login klappt nicht:** prüfen, dass du über **`https://`** zugreifst (nicht http)
  und `AUTH_SECRET` gesetzt ist.
