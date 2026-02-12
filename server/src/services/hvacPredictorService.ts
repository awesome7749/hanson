import OpenAI from 'openai';
import { PropertyData, HVACPrediction } from '../types';
import { HVAC_SYSTEM_PROMPT } from '../prompts/hvacPrompt';

export class HVACPredictorService {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string) {
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key is not configured');
    }
    this.openai = new OpenAI({ apiKey });
    // As requested: use the latest GPT-5.2 model by default.
    // You can override via OPENAI_MODEL if needed.
    this.model = process.env.OPENAI_MODEL || 'gpt-5.2';
  }

  async predictHVAC(propertyData: PropertyData): Promise<HVACPrediction> {
    try {
      const userMessage = this.formatPropertyDataForPrompt(propertyData);

      // Use OpenAI Responses API (recommended over legacy Chat Completions).
      // Request JSON output with a schema-like structure for reliability.
      const response = await this.openai.responses.create({
        model: this.model,
        input: [
          { role: 'system', content: HVAC_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.1,
        text: {
          format: {
            type: 'json_object',
          },
        },
      });

      const responseText =
        // SDK convenience field (if available)
        (response as any).output_text ??
        // Fallback: extract first output message text content
        this.extractResponseText(response);

      if (!responseText) {
        throw new Error('No response text from OpenAI');
      }

      const prediction = JSON.parse(responseText) as HVACPrediction;
      
      // Validate response has required fields
      if (
        prediction.numberOfODU == null ||
        !prediction.typeOfODU ||
        !prediction.oduSize ||
        prediction.numberOfIDU == null ||
        !prediction.typeOfIDU ||
        !prediction.iduSize
      ) {
        throw new Error('Incomplete prediction response from OpenAI');
      }

      return prediction;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`HVAC Prediction Error: ${error.message}`);
      }
      throw error;
    }
  }

  private extractResponseText(response: any): string | null {
    try {
      // Typical Responses API shape: response.output is an array of items.
      // We look for output messages and concatenate any output_text segments.
      const outputItems: any[] = response?.output || [];
      const texts: string[] = [];

      for (const item of outputItems) {
        if (item?.type !== 'message') continue;
        const content = item?.content || [];
        for (const c of content) {
          if (c?.type === 'output_text' && typeof c?.text === 'string') {
            texts.push(c.text);
          }
        }
      }

      return texts.length > 0 ? texts.join('\n') : null;
    } catch {
      return null;
    }
  }

  private formatPropertyDataForPrompt(data: PropertyData): string {
    const parts: string[] = [
      '# Property Information',
      `Address: ${data.formattedAddress}`,
      `City: ${data.city}, ${data.state} ${data.zipCode}`,
    ];

    if (data.propertyType) parts.push(`Property Type: ${data.propertyType}`);
    if (data.squareFootage) parts.push(`Square Footage: ${data.squareFootage.toLocaleString()} sq ft`);
    if (data.bedrooms) parts.push(`Bedrooms: ${data.bedrooms}`);
    if (data.bathrooms) parts.push(`Bathrooms: ${data.bathrooms}`);
    if (data.yearBuilt) parts.push(`Year Built: ${data.yearBuilt}`);
    if (data.lotSize) parts.push(`Lot Size: ${data.lotSize.toLocaleString()} sq ft`);

    // Include HVAC-related features if available
    if (data.features) {
      const hvacFeatures = Object.keys(data.features)
        .filter(key => 
          key.toLowerCase().includes('hvac') || 
          key.toLowerCase().includes('heating') || 
          key.toLowerCase().includes('cooling') ||
          key.toLowerCase().includes('ac') ||
          key.toLowerCase().includes('air')
        )
        .map(key => `${key}: ${data.features![key]}`);
      
      if (hvacFeatures.length > 0) {
        parts.push('\n## Existing HVAC Features');
        parts.push(...hvacFeatures);
      }
    }

    parts.push('\n## Task');
    parts.push('Based on this property information, predict the optimal HVAC system configuration following the guidelines provided in your system prompt. Respond with a JSON object containing your prediction.');

    return parts.join('\n');
  }
}
