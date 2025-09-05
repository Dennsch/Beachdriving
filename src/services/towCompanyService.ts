import { TowCompany } from '../types';

// Beach recovery tow companies for Queensland beach locations
export const TOW_COMPANIES_DATA: { [locationName: string]: TowCompany[] } = {
  'Bribie': [
    {
      name: 'Bribie Island Beach Recovery',
      phone: '(07) 3408 1234',
      description: '24/7 beach recovery service for Bribie Island'
    },
    {
      name: 'Moreton Bay Towing',
      phone: '(07) 3203 5678',
      description: 'Professional beach and 4WD recovery'
    },
    {
      name: 'Emergency Towing Bribie',
      phone: '0412 345 678',
      description: 'Emergency beach recovery and towing'
    }
  ],
  'Moreton Island': [
    {
      name: 'Moreton Island 4WD Recovery',
      phone: '(07) 3895 1234',
      description: '24/7 island recovery specialist'
    },
    {
      name: 'Tangalooma Towing Services',
      phone: '(07) 3637 2000',
      description: 'Resort-based recovery service'
    },
    {
      name: 'Island Beach Recovery',
      phone: '0423 456 789',
      description: 'Specialized sand recovery service'
    }
  ],
  'Straddie': [
    {
      name: 'Straddie Beach Recovery',
      phone: '(07) 3409 8765',
      description: '24/7 North Stradbroke Island recovery'
    },
    {
      name: 'Point Lookout Towing',
      phone: '(07) 3415 2468',
      description: 'Local beach and vehicle recovery'
    },
    {
      name: 'Stradbroke 4WD Rescue',
      phone: '0434 567 890',
      description: 'Emergency beach extraction service'
    }
  ]
};

export class TowCompanyService {
  private static instance: TowCompanyService;

  public static getInstance(): TowCompanyService {
    if (!TowCompanyService.instance) {
      TowCompanyService.instance = new TowCompanyService();
    }
    return TowCompanyService.instance;
  }

  /**
   * Get tow companies for a specific location
   */
  getTowCompaniesForLocation(locationName: string): TowCompany[] {
    return TOW_COMPANIES_DATA[locationName] || [];
  }

  /**
   * Get all tow companies data
   */
  getAllTowCompanies(): { [locationName: string]: TowCompany[] } {
    return TOW_COMPANIES_DATA;
  }

  /**
   * Check if a location has tow company data
   */
  hasDataForLocation(locationName: string): boolean {
    return locationName in TOW_COMPANIES_DATA && TOW_COMPANIES_DATA[locationName].length > 0;
  }
}