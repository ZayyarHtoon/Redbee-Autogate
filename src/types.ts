/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BankAccount {
  id: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
}

export interface CompanyProfile {
  name: string;
  logoUrl?: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  taxId: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  bankAccounts?: BankAccount[];
  currency: string; // e.g., "USD", "EUR", "MYR"
  defaultTaxRate: number; // percentage
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  taxRate: number; // percentage
}

export interface DocItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // percentage
}

export type DocumentType = 'quotation' | 'invoice';

export type DocumentStatus = 
  | 'draft' 
  | 'sent' 
  | 'paid' 
  | 'overdue' 
  | 'accepted' 
  | 'declined';

export interface Document {
  id: string;
  type: DocumentType;
  number: string;
  date: string;
  dueDate: string;
  clientId: string;
  items: DocItem[];
  discountType: 'percentage' | 'flat';
  discountValue: number;
  shipping: number;
  notes: string;
  status: DocumentStatus;
  companyProfile: CompanyProfile; // snapshotted at creation
  convertedToInvoiceId?: string; // for quotations
  convertedFromQuotationId?: string; // for invoices
}
