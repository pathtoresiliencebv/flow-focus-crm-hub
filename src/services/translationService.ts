
// Mock translation service - in productie zou dit een echte API aanroepen
export class TranslationService {
  private static translations: Record<string, Record<string, Record<string, string>>> = {
    // Nederlands naar andere talen
    "nl": {
      "pl": {
        "Hallo": "Cześć",
        "Bedankt": "Dziękuję",
        "Goed werk": "Dobra robota",
        "Project voltooid": "Projekt zakończony",
        "Wanneer ben je klaar?": "Kiedy będziesz gotowy?",
      },
      "cs": {
        "Hallo": "Ahoj",
        "Bedankt": "Děkuji",
        "Goed werk": "Dobrá práce",
        "Project voltooid": "Projekt dokončen",
        "Wanneer ben je klaar?": "Kdy budeš hotový?",
      }
    },
    // Pools naar Nederlands
    "pl": {
      "nl": {
        "Cześć": "Hallo",
        "Dziękuję": "Bedankt",
        "Dobra robota": "Goed werk",
        "Projekt zakończony": "Project voltooid",
        "Dzień dobry, projekt jest gotowy do przeglądu": "Goedemorgen, het project is klaar voor beoordeling",
        "Kiedy będziesz gotowy?": "Wanneer ben je klaar?",
      }
    },
    // Tsjechisch naar Nederlands
    "cs": {
      "nl": {
        "Ahoj": "Hallo",
        "Děkuji": "Bedankt",
        "Dobrá práce": "Goed werk",
        "Projekt dokončen": "Project voltooid",
        "Kdy budeš hotový?": "Wanneer ben je klaar?",
      }
    }
  };

  static async translateText(
    text: string, 
    fromLanguage: string, 
    toLanguage: string
  ): Promise<string> {
    // Simuleer API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Als talen hetzelfde zijn, return originele tekst
    if (fromLanguage === toLanguage) {
      return text;
    }

    const langDict = this.translations[fromLanguage]?.[toLanguage];
    
    if (langDict) {
      // Zoek exacte match
      if (langDict[text]) {
        return langDict[text];
      }
      
      // Zoek gedeeltelijke match voor langere zinnen
      for (const [key, value] of Object.entries(langDict)) {
        if (text.includes(key)) {
          return text.replace(key, value);
        }
      }
    }

    // Fallback: return originele tekst met indicator dat vertaling niet beschikbaar is
    return text;
  }

  static getSupportedLanguages(): { code: string; name: string }[] {
    return [
      { code: "nl", name: "Nederlands" },
      { code: "pl", name: "Polski" },
      { code: "cs", name: "Čeština" },
      { code: "en", name: "English" },
      { code: "de", name: "Deutsch" },
    ];
  }

  static detectLanguage(text: string): string {
    // Simpele taaldetectie op basis van karakteristieke woorden
    const polishWords = ["dzień", "dobry", "projekt", "jest", "gotowy", "dziękuję"];
    const czechWords = ["ahoj", "děkuji", "práce", "projekt", "dokončen"];
    const dutchWords = ["hallo", "bedankt", "werk", "project", "voltooid", "goedemorgen"];

    const lowerText = text.toLowerCase();
    
    if (polishWords.some(word => lowerText.includes(word))) {
      return "pl";
    }
    if (czechWords.some(word => lowerText.includes(word))) {
      return "cs";
    }
    if (dutchWords.some(word => lowerText.includes(word))) {
      return "nl";
    }
    
    // Default naar Nederlands
    return "nl";
  }
}
