# Měření času

Interaktivní webová aplikace se dvěma režimy: **přesýpací hodiny** (Lottie animace) a **stopky** s kyvadlem, mezičasy a ovládáním Spustit / Zastavit / Reset.

## Spuštění

Otevřete `index.html` v prohlížeči, nebo spusťte lokální server:

```bash
npm install
npm run dev
```

Poté otevřete [http://127.0.0.1:8766](http://127.0.0.1:8766).

## Online verze (GitHub Pages)

Po pushi na větev `main` se aplikace automaticky nasadí přes GitHub Actions. Adresa bude:

**https://frantisekvvb.github.io/mereni_casu/**

(Poprvé může nasazení trvat 1–2 minuty.)

## Režimy

### Přesýpací hodiny
1. Po načtení stránky písek sám začne padat (~8 s).
2. Animace se zastaví a zobrazí se tlačítko **Otočit hodiny**.
3. Kliknutím se hodiny otočí a písek znovu padá.
4. Cyklus lze opakovat – střídá se první a druhé přesypání.

### Stopky
- Hlavní čas ve formátu `00 : 00,00`
- Tlačítka **Spustit** / **Zastavit**, **Mezičas** a **Reset**
- Kyvadlo se kývá po celou dobu
- Mezičasy se zobrazí pod stopkami (nejnovější nahoře)

## Struktura

- `index.html` – stránka
- `styles.css` – styly
- `main.js` – logika animace a ovládání
- `assets/hourglass.json` – Lottie animace přesýpacích hodin
- `assets/stopwatch.svg` – SVG stopky s kyvadlem

## Technologie

- [Lottie Web](https://github.com/airbnb/lottie-web) 5.12
- Statický web (HTML, CSS, JS) – vhodné pro GitHub Pages
