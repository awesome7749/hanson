import axios from 'axios';
import { PropertyData } from '../types';

export class RentCastService {
  private apiKey: string;
  private baseUrl = 'https://api.rentcast.io/v1';

  constructor(apiKey: string) {
    if (!apiKey || apiKey === 'your_rentcast_api_key_here') {
      throw new Error('RentCast API key is not configured');
    }
    this.apiKey = apiKey;
  }

  async getPropertyData(address: string): Promise<PropertyData> {
    try {
      const response = await axios.get(`${this.baseUrl}/properties`, {
        params: { address },
        headers: {
          'X-Api-Key': this.apiKey,
          'accept': 'application/json',
        },
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No property found for this address');
      }

      const data = response.data[0];

      return {
        id: data.id,
        formattedAddress: data.formattedAddress || data.addressLine1,
        addressLine1: data.addressLine1,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        latitude: data.latitude,
        longitude: data.longitude,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        squareFootage: data.squareFootage,
        lotSize: data.lotSize,
        yearBuilt: data.yearBuilt,
        propertyType: data.propertyType,
        lastSalePrice: data.lastSalePrice,
        lastSaleDate: data.lastSaleDate,
        assessedValue: data.assessedValue,
        features: data.features,
        ...data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`RentCast API Error: ${error.response?.status} ${error.response?.statusText || error.message}`);
      }
      throw error;
    }
  }
}
