/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CompanyProfile, Client, Product, Document } from './types';

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  name: 'Redbee Autogate & Security',
  email: 'redbeeautogate@gmail.com',
  phone: '+95 9 123 456 789',
  website: 'www.redbeeautogate.com',
  address: 'Yangon, Myanmar',
  taxId: 'REG-MM-2026-X',
  bankName: 'KBZ Bank',
  bankAccount: '1234 5678 9012',
  bankHolder: 'Redbee Autogate & Security',
  bankAccounts: [
    {
      id: 'bank-1',
      bankName: 'KBZ Bank',
      bankAccount: '1234 5678 9012',
      bankHolder: 'Redbee Autogate & Security'
    }
  ],
  currency: 'MMK',
  defaultTaxRate: 0, // default no tax or customizable
};

export const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Mr. John Tan',
    company: 'Alpha Residence Management',
    email: 'john.tan@alpharesidence.com',
    phone: '+60 16-222 3344',
    address: 'Block A, Alpha Condominium, Jalan Kiara, Mont Kiara, 50480 Kuala Lumpur',
    taxId: 'MS-9988221-A',
  },
  {
    id: 'c2',
    name: 'Ms. Alice Wong',
    company: 'Wong Dental Clinic',
    email: 'contact@wongdental.com',
    phone: '+60 19-333 4455',
    address: 'No. 15, Ground Floor, Jalan SS21/37, Damansara Utama, 47400 Petaling Jaya, Selangor',
    taxId: 'REG-991823-V',
  },
  {
    id: 'c3',
    name: 'Dato\' Sri Hamzah',
    company: 'Private Villa',
    email: 'hamzah.v@gmail.com',
    phone: '+60 12-777 8888',
    address: 'Lot 1045, Lorong Bukit Melawati, Taman Melawati, 53100 Kuala Lumpur',
  }
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'DCMoto GFM-925AL Swing/Folding Autogate System',
    description: 'Heavy duty hybrid power swing/folding autogate system. Includes 2x arm motors, control panel, backup battery, receiver, 3x remote controls, and full professional installation.',
    unitPrice: 1350000,
    taxRate: 0,
  },
  {
    id: 'p2',
    name: 'Fadini Elpro 12 Sliding Autogate Motor (Italian Brand)',
    description: 'High-speed heavy-duty oil-bath sliding autogate motor suitable for residential gates up to 800kg. Includes 4m gear racks, control board, photocells, and installation.',
    unitPrice: 2850000,
    taxRate: 0,
  },
  {
    id: 'p3',
    name: 'Autogate backup rechargeable lead-acid battery 12V 7AH',
    description: 'Standard backup battery for autogate controllers. Provides emergency power up to 24 hours during electrical outages.',
    unitPrice: 65000,
    taxRate: 0,
  },
  {
    id: 'p4',
    name: '4-Channel Premium Remote Control (433MHz)',
    description: 'Replacement high-security rolling-code remote control transmitter.',
    unitPrice: 45000,
    taxRate: 0,
  },
  {
    id: 'p5',
    name: 'On-site troubleshooting, wiring repair & motor servicing',
    description: 'On-site physical inspection, diagnostic check, motor carbon brush replacement, alignment adjustment, and joint lubrication.',
    unitPrice: 120000,
    taxRate: 0,
  },
  {
    id: 'p6',
    name: 'Autogate infrared safety photoelectric beam sensor',
    description: 'A pair of waterproof safety photo sensors to prevent gate closing on vehicles or pedestrians.',
    unitPrice: 180000,
    taxRate: 0,
  }
];

export const DEFAULT_DOCUMENTS: Document[] = [
  {
    id: 'doc1',
    type: 'quotation',
    number: 'QT-2026-001',
    date: '2026-07-01',
    dueDate: '2026-07-31',
    clientId: 'c1',
    items: [
      {
        id: 'i1',
        productId: 'p1',
        description: 'DCMoto GFM-925AL Swing/Folding Autogate System',
        quantity: 1,
        unitPrice: 1350000,
        taxRate: 0,
      },
      {
        id: 'i2',
        productId: 'p6',
        description: 'Autogate infrared safety photoelectric beam sensor',
        quantity: 1,
        unitPrice: 180000,
        taxRate: 0,
      }
    ],
    discountType: 'flat',
    discountValue: 50000,
    shipping: 0,
    notes: 'Quotation valid for 30 days from the issue date. Pricing includes standard installation and cabling. Payment: 50% deposit upon acceptance, 50% upon completion.',
    status: 'accepted',
    companyProfile: DEFAULT_COMPANY_PROFILE,
    convertedToInvoiceId: 'doc2',
  },
  {
    id: 'doc2',
    type: 'invoice',
    number: 'INV-2026-001',
    date: '2026-07-03',
    dueDate: '2026-07-17',
    clientId: 'c1',
    items: [
      {
        id: 'i1',
        productId: 'p1',
        description: 'DCMoto GFM-925AL Swing/Folding Autogate System',
        quantity: 1,
        unitPrice: 1350000,
        taxRate: 0,
      },
      {
        id: 'i2',
        productId: 'p6',
        description: 'Autogate infrared safety photoelectric beam sensor',
        quantity: 1,
        unitPrice: 180000,
        taxRate: 0,
      }
    ],
    discountType: 'flat',
    discountValue: 50000,
    shipping: 0,
    notes: 'Thank you for your business! Completed installation on 2026-07-03. Warranty: 1 year parts and labor. Please make bank transfer to KBZ Bank account: 1234 5678 9012.',
    status: 'paid',
    companyProfile: DEFAULT_COMPANY_PROFILE,
    convertedFromQuotationId: 'doc1',
  },
  {
    id: 'doc3',
    type: 'quotation',
    number: 'QT-2026-002',
    date: '2026-07-05',
    dueDate: '2026-08-05',
    clientId: 'c3',
    items: [
      {
        id: 'i3',
        productId: 'p2',
        description: 'Fadini Elpro 12 Sliding Autogate Motor (Italian Brand)',
        quantity: 1,
        unitPrice: 2850000,
        taxRate: 0,
      },
      {
        id: 'i4',
        productId: 'p3',
        description: 'Autogate backup rechargeable lead-acid battery 12V 7AH',
        quantity: 1,
        unitPrice: 65000,
        taxRate: 0,
      }
    ],
    discountType: 'percentage',
    discountValue: 5,
    shipping: 0,
    notes: 'Premium sliding gate system with Italian-imported motor. Includes intensive use testing. Warranty: 2 years on motor drive.',
    status: 'sent',
    companyProfile: DEFAULT_COMPANY_PROFILE,
  },
  {
    id: 'doc4',
    type: 'invoice',
    number: 'INV-2026-002',
    date: '2026-07-08',
    dueDate: '2026-07-22',
    clientId: 'c2',
    items: [
      {
        id: 'i5',
        productId: 'p5',
        description: 'On-site troubleshooting, wiring repair & motor servicing',
        quantity: 1,
        unitPrice: 120000,
        taxRate: 0,
      },
      {
        id: 'i6',
        productId: 'p3',
        description: 'Autogate backup rechargeable lead-acid battery 12V 7AH',
        quantity: 1,
        unitPrice: 65000,
        taxRate: 0,
      }
    ],
    discountType: 'flat',
    discountValue: 0,
    shipping: 0,
    notes: 'Service work completed on-site. Battery replacement. Payment is due within 14 days.',
    status: 'sent',
    companyProfile: DEFAULT_COMPANY_PROFILE,
  }
];

// Helper functions for LocalStorage management
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading localStorage key:', key, error);
    return defaultValue;
  }
};

export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing localStorage key:', key, error);
  }
};
