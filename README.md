# Knihovna - Výběr knih

Webová aplikace pro výběr knih podle země původu autora, žánru a tématu.

## 🚀 Jak to funguje

- **Lokální vývoj**: Můžete otevřít `index.html` přímo v prohlížeči
- **GitHub Pages**: Automaticky se nasadí při push do main/master branch
- **Data**: Knihy jsou uloženy v `knihy.csv` a automaticky převedeny do `books-data.js`

## 📁 Struktura projektu

```
├── index.html          # Hlavní HTML soubor
├── script.js           # JavaScript logika
├── styles.css          # CSS styly
├── knihy.csv           # Data knih (editovatelné)
├── books-data.js       # Vygenerovaná data (needitovat!)
├── csv_to_js.py        # Skript pro převod CSV → JS
├── covers/             # Obaly knih
└── .github/workflows/  # GitHub Actions
```

## 🛠️ Správa knih

### Přidání nové knihy
1. Otevřete `knihy.csv`
2. Přidejte nový řádek s daty knihy
3. Spusťte `python csv_to_js.py` (nebo pushněte do GitHubu)

### Lokální převod dat
```bash
python csv_to_js.py
```

### Struktura CSV
```csv
country,genre,topic,author,name,description,year
čeští,sci-fi,,Autor,Název knihy,"Popis knihy",2023
```

## 🔧 Deployment

### GitHub Pages
1. Pushněte změny do main/master branch
2. GitHub Actions automaticky:
   - Převede CSV na JavaScript
   - Nasadí web na GitHub Pages
3. Web bude dostupný na: `https://username.github.io/repository-name/`

### Lokální testování
Stačí otevřít `index.html` v prohlížeči - žádný server není potřeba!

## ⚙️ GitHub Pages nastavení

1. Jděte do **Settings** → **Pages**
2. Nastavte **Source**: "GitHub Actions"
3. Workflow se spustí automaticky při každém push

## 🎨 Přizpůsobení

- **Styly**: Upravte `styles.css`
- **Logika**: Upravte `script.js`  
- **Obaly knih**: Přidejte obrázky do složky `covers/`
- **Data**: Upravte `knihy.csv` a spusťte převod

## 🐛 Řešení problémů

### CORS chyby
- Ujistěte se, že je načten `books-data.js` před `script.js`
- Pro lokální testování otevřete soubor přímo v prohlížeči

### Chybějící obaly knih
- Název obrázku musí být: `Autor - Název knihy.jpg`
- Uložte do složky `covers/`

## 📝 Poznámky

- `books-data.js` je generovaný soubor - neupravujte ho ručně
- Vždy upravujte data v `knihy.csv`
- GitHub Actions zajistí automatický převod při každém push
