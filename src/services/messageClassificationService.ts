import { AIContextData } from '@/hooks/useAIContext';

export interface MessageClassification {
  intent: 'question' | 'request' | 'update' | 'complaint' | 'acknowledgment' | 'other';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  topics: string[];
  entities: {
    projects?: string[];
    materials?: string[];
    dates?: string[];
    locations?: string[];
  };
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

export class MessageClassificationService {
  private intentPatterns = {
    question: [
      /\?(.*)/,
      /wanneer(.*)/i,
      /hoe(.*)/i,
      /wat(.*)/i,
      /waar(.*)/i,
      /waarom(.*)/i,
      /welke(.*)/i,
      /kunnen jullie(.*)/i,
      /is het mogelijk(.*)/i
    ],
    request: [
      /kun je(.*)/i,
      /kunnen jullie(.*)/i,
      /wil je(.*)/i,
      /zou je(.*)/i,
      /graag(.*)/i,
      /nodig(.*)/i,
      /bestellen(.*)/i,
      /regelen(.*)/i,
      /organiseren(.*)/i
    ],
    update: [
      /voltooid(.*)/i,
      /klaar(.*)/i,
      /gelukt(.*)/i,
      /afgerond(.*)/i,
      /geïnstalleerd(.*)/i,
      /gerepareerd(.*)/i,
      /status(.*)/i,
      /update(.*)/i
    ],
    complaint: [
      /probleem(.*)/i,
      /storing(.*)/i,
      /defect(.*)/i,
      /werkt niet(.*)/i,
      /kapot(.*)/i,
      /fout(.*)/i,
      /slecht(.*)/i,
      /ontevreden(.*)/i
    ],
    acknowledgment: [
      /ok(.*)/i,
      /goed(.*)/i,
      /bedankt(.*)/i,
      /dank je(.*)/i,
      /prima(.*)/i,
      /akkoord(.*)/i,
      /begrepen(.*)/i,
      /duidelijk(.*)/i
    ]
  };

  private urgencyPatterns = {
    critical: [
      /urgent(.*)/i,
      /spoedig(.*)/i,
      /direct(.*)/i,
      /onmiddellijk(.*)/i,
      /noodgeval(.*)/i,
      /storing(.*)/i,
      /leak(.*)/i,
      /gevaar(.*)/i
    ],
    high: [
      /snel(.*)/i,
      /vandaag(.*)/i,
      /deze week(.*)/i,
      /belangrijk(.*)/i,
      /prioriteit(.*)/i,
      /klant wacht(.*)/i
    ],
    medium: [
      /volgende week(.*)/i,
      /binnenkort(.*)/i,
      /planning(.*)/i,
      /afspraak(.*)/i
    ]
  };

  private sentimentPatterns = {
    positive: [
      /goed(.*)/i,
      /prima(.*)/i,
      /perfect(.*)/i,
      /tevreden(.*)/i,
      /bedankt(.*)/i,
      /geweldig(.*)/i,
      /uitstekend(.*)/i
    ],
    negative: [
      /slecht(.*)/i,
      /probleem(.*)/i,
      /ontevreden(.*)/i,
      /teleurgesteld(.*)/i,
      /fout(.*)/i,
      /storing(.*)/i,
      /niet goed(.*)/i
    ]
  };

  async classifyMessage(text: string, context?: AIContextData): Promise<MessageClassification> {
    const classification: MessageClassification = {
      intent: this.detectIntent(text),
      urgency: this.detectUrgency(text),
      topics: this.extractTopics(text),
      entities: await this.extractEntities(text),
      sentiment: this.detectSentiment(text),
      confidence: 0.8 // Base confidence, could be improved with ML
    };

    // Adjust confidence based on pattern matches
    classification.confidence = this.calculateConfidence(text, classification);

    return classification;
  }

  private detectIntent(text: string): MessageClassification['intent'] {
    const lowerText = text.toLowerCase();
    
    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(lowerText)) {
          return intent as MessageClassification['intent'];
        }
      }
    }
    
    return 'other';
  }

  private detectUrgency(text: string): MessageClassification['urgency'] {
    const lowerText = text.toLowerCase();
    
    for (const [urgency, patterns] of Object.entries(this.urgencyPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(lowerText)) {
          return urgency as MessageClassification['urgency'];
        }
      }
    }
    
    return 'low';
  }

  private detectSentiment(text: string): MessageClassification['sentiment'] {
    const lowerText = text.toLowerCase();
    
    for (const pattern of this.sentimentPatterns.positive) {
      if (pattern.test(lowerText)) {
        return 'positive';
      }
    }
    
    for (const pattern of this.sentimentPatterns.negative) {
      if (pattern.test(lowerText)) {
        return 'negative';
      }
    }
    
    return 'neutral';
  }

  private extractTopics(text: string): string[] {
    const topics: string[] = [];
    const topicKeywords = [
      'installatie', 'materiaal', 'onderdelen', 'planning', 'afspraak',
      'reparatie', 'onderhoud', 'garantie', 'factuur', 'betaling',
      'leverancier', 'bestelling', 'deadline', 'project', 'klant'
    ];
    
    const lowerText = text.toLowerCase();
    topicKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        topics.push(keyword);
      }
    });
    
    return topics;
  }

  async extractEntities(text: string): Promise<MessageClassification['entities']> {
    const entities: MessageClassification['entities'] = {};
    
    // Extract dates
    const datePatterns = [
      /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g,
      /vandaag|morgen|overmorgen|volgende week|deze week/gi,
      /(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)/gi
    ];
    
    entities.dates = [];
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        entities.dates!.push(...matches);
      }
    });
    
    // Extract materials (basic pattern matching)
    const materialKeywords = [
      'pijp', 'buis', 'fitting', 'kraan', 'ventiel', 'pomp', 
      'boiler', 'radiator', 'thermostaat', 'sensor', 'meter'
    ];
    
    entities.materials = [];
    const lowerText = text.toLowerCase();
    materialKeywords.forEach(material => {
      if (lowerText.includes(material)) {
        entities.materials!.push(material);
      }
    });
    
    // Extract locations
    const locationPatterns = [
      /keuken|badkamer|toilet|zolder|kelder|garage|woonkamer|slaapkamer/gi,
      /verdieping|etage|begane grond/gi
    ];
    
    entities.locations = [];
    locationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        entities.locations!.push(...matches);
      }
    });
    
    return entities;
  }

  private calculateConfidence(text: string, classification: MessageClassification): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on multiple pattern matches
    if (classification.topics.length > 0) confidence += 0.1;
    if (Object.values(classification.entities).some(arr => arr && arr.length > 0)) confidence += 0.1;
    if (classification.intent !== 'other') confidence += 0.2;
    if (classification.urgency !== 'low') confidence += 0.1;
    
    // Decrease confidence for very short messages
    if (text.length < 10) confidence -= 0.2;
    
    return Math.min(Math.max(confidence, 0.1), 1.0);
  }

  async getSimilarConversations(classification: MessageClassification): Promise<string[]> {
    // This would query the database for similar classified messages
    // For now, return empty array - could be implemented with vector similarity
    return [];
  }
}