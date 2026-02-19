export interface PropertyData {
  id?: string;
  formattedAddress: string;
  addressLine1?: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  lastSalePrice?: number;
  lastSaleDate?: string;
  assessedValue?: number;
  features?: Record<string, any>;
  [key: string]: any;
}

export interface UserHints {
  hasExistingDuctwork?: boolean;  // Does the home have existing ductwork?
  numberOfRooms?: number;         // How many rooms to heat/cool?
}

export interface HVACPrediction {
  numberOfODU: number;
  typeOfODU: string; // "Multi", "Duct", "Single", "Multi+Single"
  oduSize: string; // "42", "36+27"
  numberOfIDU: number;
  typeOfIDU: string; // "Head", "AHU", "Head+AHU"
  iduSize: string; // "12,9,9,9"
  electricalWorkEstimate?: number;
  hvacWorkEstimate?: number;
  confidence?: string; // "high", "medium", "low"
  reasoning?: string;
}

export interface ActualHVACData {
  location: string;
  numberOfODU: number;
  typeOfODU: string;
  oduSize: string;
  numberOfIDU: number;
  typeOfIDU: string;
  iduSize: string;
  electricalWork: number;
  hvacWork: number;
  rebate: number;
  closedPrice: string;
}

export interface ComparisonResult {
  address: string;
  actual: ActualHVACData;
  predicted: HVACPrediction;
  propertyData?: PropertyData;
  matchType: 'exact' | 'close' | 'directional' | 'incorrect';
  details: string;
}

export interface TestResults {
  totalTests: number;
  exactMatches: number;
  closeMatches: number;
  directionalMatches: number;
  incorrectMatches: number;
  accuracyRate: number;
  comparisons: ComparisonResult[];
  timestamp: string;
}
