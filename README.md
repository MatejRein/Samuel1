# Biblická výzva – živý kvíz pre viac hráčov

Hotová webová aplikácia po slovensky s 10 veselými otázkami o Lectio divina, Biblii a Samuelovi. Moderátor premieta otázky; súťažiaci sa pripájajú cez QR kód alebo šesťmiestny PIN a hrajú súčasne na mobiloch.

## Spustenie na vlastnom počítači

1. Nainštalujte Node.js 20 alebo novší z https://nodejs.org/.
2. V termináli otvorte priečinok projektu.
3. Spustite `npm install` a potom `npm start`.
4. Otvorte `http://localhost:3000`.
5. Kliknite na **Som moderátor**. Zobrazí sa PIN a QR kód.

**Dôležité:** Ak používate `localhost`, QR kód povedie na localhost a na iných mobiloch fungovať nebude. Pre reálnych účastníkov treba verejnú HTTPS adresu (návod nižšie) alebo nastaviť `PUBLIC_URL=http://IP-ADRESA-POČÍTAČA:3000` a sprístupniť port 3000 v miestnej Wi-Fi sieti. Všetky mobily musia vedieť danú adresu otvoriť. Ak napríklad počítač má IP 192.168.1.50, použite `http://192.168.1.50:3000`. QR kód sa generuje na serveri.

## Zverejnenie cez internet (Render)

1. Rozbaľte ZIP a vložte súbory projektu do nového repozitára na GitHube (server.js a package.json musia byť v koreňovom priečinku repozitára).
2. Na https://render.com/ založte **New → Web Service**, pripojte GitHub repozitár.
3. Nastavte **Build Command**: `npm install` a **Start Command**: `npm start`.
4. Po zverejnení otvorte pridelenú adresu `https://...onrender.com` na notebooku moderátora a zvoľte **Som moderátor**.
5. Premietnite obrazovku s QR kódom. Hráči naskenujú QR mobilom, zadajú prezývku a čakajú na spustenie.

Možnosti a prípadné ceny hostingu sa môžu meniť. Render môže mať pri neaktivite odklad spustenia v bezplatných plánoch. Na podujatí otvorte aplikáciu vopred a overte pripojenie niekoľkých mobilov.

## Pravidlá

- Jeden moderátor vytvorí jednu hru a dostane šesťmiestny PIN.
- Hráči sa pripájajú menom; rovnaké prezývky v jednej hre nie sú povolené.
- Moderátor spúšťa ďalšie otázky. Na otázku je približne 20 sekúnd.
- Za správnu odpoveď je 500 až 1000 bodov podľa rýchlosti. Nesprávna odpoveď = 0.
- Jeden hráč môže odoslať iba jednu odpoveď na otázku.
- Pri výpadku siete sa hráč na tom istom prehliadači môže pripojiť znovu; server si body pamätá počas života procesu.
- Herné miestnosti sa po piatich hodinách neaktivity mažú; pri reštarte hostingu sa aktívne hry stratia. Predpokladaný strop v aplikácii je 500 hráčov na hru, ale skutočná kapacita závisí od servera a siete; pri veľkých podujatiach je nutný záťažový test.

## Bezpečnosť a úpravy

Moderátor má tajný prístupový token uložený iba pre aktuálnu reláciu prehliadača. Nezdieľajte moderátorskú reláciu ani jej údaje. Účastníci vidia iba verejný PIN a otázky. Herné údaje sa ukladajú do pamäte servera; nevyžaduje sa účet ani databáza. Otázky je možné upraviť v poli `Q` v súbore `server.js`. Otázky sú pripravené podľa katolíckeho počtu biblických kníh (73 = 46 + 27). Najkratší je Žalm 117 v hebrejskom číslovaní.

## Najjednoduchšie publikovanie ako jedna webová adresa

Aplikácia potrebuje server pre súčasné pripojenie mobilov. Samotný HTML súbor alebo obyčajný statický hosting nepostačuje.

1. Vytvorte si bezplatný účet na https://github.com a nový repozitár (napr. `biblicky-kahoot`).
2. Nahrajte *obsah* tohto priečinka (nie nadradený priečinok) do repozitára cez **Add file → Upload files → Commit changes**.
3. Otvorte https://dashboard.render.com/blueprints , zvoľte nový Blueprint a pripojte repozitár. Súbor `render.yaml` vyplní potrebné nastavenia.
4. Po úspešnom spustení dostanete stabilnú adresu typu `https://biblicky-kahoot-xxxx.onrender.com`. Uložte si ju medzi záložky, nabudúce už stačí kliknúť na tento odkaz.
5. Kliknite na „Som moderátor“ a zobrazte QR kód. Mobily hráčov môžu byť na ľubovoľnom internetovom pripojení.

Poznámka: Hosting môže vyžadovať výber plánu a podmienky služieb sa môžu meniť. Verejná webová adresa vznikne až po nasadení na účet vlastníka; nie je súčasťou ZIP súboru.
