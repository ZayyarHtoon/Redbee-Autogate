/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Document, Client, DocumentStatus, DocumentType } from '../types';
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Plus, 
  Filter, 
  FileCheck,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

interface DocumentsListProps {
  documents: Document[];
  clients: Client[];
  currency: string;
  onEditDoc: (docId: string) => void;
  onViewDoc: (docId: string) => void;
  onDeleteDoc: (docId: string) => void;
  onConvertQuotation: (docId: string) => void;
  onNewDoc: (type: 'quotation' | 'invoice') => void;
}

export default function DocumentsList({
  documents,
  clients,
  currency,
  onEditDoc,
  onViewDoc,
  onDeleteDoc,
  onConvertQuotation,
  onNewDoc,
}: DocumentsListProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | DocumentType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>('all');

  // Calculations for document grand total
  const calculateTotal = (doc: Document) => {
    const subtotal = doc.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = doc.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
    let discount = 0;
    if (doc.discountType === 'percentage') {
      discount = subtotal * (doc.discountValue / 100);
    } else {
      discount = doc.discountValue;
    }
    return Math.max(0, subtotal + tax - discount + doc.shipping);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
      case 'accepted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'sent':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'overdue':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'declined':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-100'; // draft
    }
  };

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const client = clients.find(c => c.id === doc.clientId);
    const clientName = client?.name.toLowerCase() || '';
    const clientCompany = client?.company.toLowerCase() || '';
    const docNumber = doc.number.toLowerCase();
    const matchesSearch = docNumber.includes(search.toLowerCase()) || 
                          clientName.includes(search.toLowerCase()) ||
                          clientCompany.includes(search.toLowerCase());

    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first

  const formatCurrency = (val: number) => {
    const isMMK = currency === 'MMK';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: isMMK ? 0 : 2,
      maximumFractionDigits: isMMK ? 0 : 2
    }).format(val);
  };

  return (
    <div id="documents-list-section" className="space-y-6">
      {/* Heading Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1 block">Contract Ledger</span>
          <h2 className="text-xl font-sans font-bold text-slate-900 tracking-tight">Quotations & Invoices</h2>
          <p className="text-slate-500 text-xs">Issue legal tax documents, track approvals, and manage billing accounts.</p>
        </div>
        <div className="flex gap-2">
          <button
            id="btn-new-quotation"
            onClick={() => onNewDoc('quotation')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer shadow-2xs"
          >
            <Plus size={14} />
            Add Quote
          </button>
          <button
            id="btn-new-invoice"
            onClick={() => onNewDoc('invoice')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition cursor-pointer shadow-sm shadow-red-100"
          >
            <Plus size={14} />
            New Invoice
          </button>
        </div>
      </div>

      {/* Filters Bento Panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between bento-card">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search size={14} />
          </span>
          <input
            id="search-docs"
            type="text"
            placeholder="Search invoice number or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-transparent focus:border-slate-200 rounded-xl outline-hidden transition"
          />
        </div>

        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/40 w-full md:w-auto">
          <button
            id="tab-type-all"
            onClick={() => setTypeFilter('all')}
            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              typeFilter === 'all' 
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All
          </button>
          <button
            id="tab-type-quotations"
            onClick={() => setTypeFilter('quotation')}
            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              typeFilter === 'quotation' 
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Quotations
          </button>
          <button
            id="tab-type-invoices"
            onClick={() => setTypeFilter('invoice')}
            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              typeFilter === 'invoice' 
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Invoices
          </button>
        </div>

        {/* Status Filter */}
        <div className="relative w-full md:w-48">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Filter size={12} />
          </span>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full pl-8 pr-8 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-xl outline-hidden appearance-none cursor-pointer"
          >
            <option value="all">Filter Status: All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 pointer-events-none">
            <ChevronDown size={14} />
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden bento-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/50 bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="py-4 px-6">Doc Number</th>
                <th className="py-4 px-6">Client / Company</th>
                <th className="py-4 px-6">Issue Date</th>
                <th className="py-4 px-6">Due Date</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-500 text-sm">No matching records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const client = clients.find(c => c.id === doc.clientId);
                  const total = calculateTotal(doc);

                  return (
                    <tr 
                      key={doc.id} 
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      {/* Number */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${
                            doc.type === 'invoice' 
                              ? 'bg-red-50 text-red-700 border-red-100' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {doc.type === 'invoice' ? 'INV' : 'QT'}
                          </span>
                          <span 
                            onClick={() => onViewDoc(doc.id)}
                            className="font-bold text-slate-900 hover:text-red-600 transition cursor-pointer text-xs font-mono"
                          >
                            {doc.number}
                          </span>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-bold text-slate-800 text-xs">
                            {client?.name || 'Unknown Client'}
                          </div>
                          {client?.company && (
                            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{client.company}</div>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-slate-500 text-xs font-mono">
                        {doc.date}
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-6 text-slate-500 text-xs font-mono">
                        {doc.dueDate}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-6 font-bold text-slate-800 text-xs font-mono">
                        {formatCurrency(total)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest border ${getStatusStyle(doc.status)}`}>
                          <span className="w-1 h-1 rounded-full bg-current" />
                          {doc.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {/* Convert Quotation to Invoice */}
                          {doc.type === 'quotation' && doc.status === 'accepted' && !doc.convertedToInvoiceId && (
                            <button
                              title="Convert to Invoice"
                              onClick={() => onConvertQuotation(doc.id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition cursor-pointer"
                            >
                              <RefreshCw size={14} className="animate-pulse" />
                            </button>
                          )}
                          
                          {/* If already converted, show link to the invoice */}
                          {doc.type === 'quotation' && doc.convertedToInvoiceId && (
                            <button
                              title="View Linked Invoice"
                              onClick={() => onViewDoc(doc.convertedToInvoiceId!)}
                              className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink size={14} />
                              <span className="text-[10px] font-semibold">INV</span>
                            </button>
                          )}

                          {/* View */}
                          <button
                            title="View Document"
                            onClick={() => onViewDoc(doc.id)}
                            className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit */}
                          <button
                            title="Edit Document"
                            onClick={() => onEditDoc(doc.id)}
                            className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition cursor-pointer"
                          >
                            <Edit size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            title="Delete Document"
                            onClick={() => onDeleteDoc(doc.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
