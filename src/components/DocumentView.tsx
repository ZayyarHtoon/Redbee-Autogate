/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Document, Client } from '../types';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Building,
  Mail,
  Phone,
  Globe,
  FileCheck
} from 'lucide-react';

interface DocumentViewProps {
  document: Document;
  client: Client;
  onBack: () => void;
  onEdit: () => void;
  onUpdateStatus: (docId: string, status: any) => void;
}

export default function DocumentView({
  document,
  client,
  onBack,
  onEdit,
  onUpdateStatus,
}: DocumentViewProps) {
  
  const company = document.companyProfile;
  const [logoFailed, setLogoFailed] = useState(false);

  // Sums
  const subtotal = document.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxSum = document.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
  
  let discountAmount = 0;
  if (document.discountType === 'percentage') {
    discountAmount = subtotal * (document.discountValue / 100);
  } else {
    discountAmount = document.discountValue;
  }

  const grandTotal = Math.max(0, subtotal + taxSum - discountAmount + document.shipping);

  const formatCurrency = (val: number) => {
    const isMMK = company.currency === 'MMK';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: company.currency,
      minimumFractionDigits: isMMK ? 0 : 2,
      maximumFractionDigits: isMMK ? 0 : 2
    }).format(val);
  };

  const handlePrint = () => {
    try {
      const printArea = window.document.getElementById('print-area');
      if (!printArea) {
        window.print();
        return;
      }

      // Open a clean print-friendly window to bypass any iframe sandboxing issues
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        // Fallback if popup blocker stops window.open
        window.focus();
        window.print();
        return;
      }

      // Copy stylesheet link and style nodes so Tailwind styles transfer perfectly
      let stylesHtml = '';
      try {
        const styleTags = Array.from(window.document.querySelectorAll('style, link[rel="stylesheet"]'));
        stylesHtml = styleTags.map(tag => tag.outerHTML).join('\n');
      } catch (e) {
        console.warn("Could not copy stylesheets:", e);
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${document.type === 'invoice' ? 'Tax Invoice' : 'Quotation'} - ${document.number}</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            ${stylesHtml}
            <style>
              body {
                background-color: white !important;
                color: #0f172a !important;
                padding: 2.5rem !important;
                margin: 0 !important;
                font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #print-area {
                border: none !important;
                box-shadow: none !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .bento-card {
                border: 1px solid #e2e8f0 !important;
                box-shadow: none !important;
                border-radius: 1rem !important;
              }
            </style>
          </head>
          <body>
            <div id="print-area">
              ${printArea.innerHTML}
            </div>
            <script>
              window.addEventListener('load', () => {
                setTimeout(() => {
                  window.focus();
                  window.print();
                }, 500);
              });
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error("Print popout error, falling back:", err);
      window.focus();
      window.print();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'accepted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'sent':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'declined':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200'; // draft
    }
  };

  return (
    <div id="document-viewer-container" className="space-y-6">
      
      {/* Print styles injected directly to apply only when printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          /* Hide interactive bits from printing */
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Action header - hidden on print */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs no-print bento-card">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200 transition cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-red-600">Active Document</span>
              <h2 className="text-sm font-bold text-slate-900 font-mono">{document.number}</h2>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest border capitalize ${getStatusBadge(document.status)}`}>
                {document.status}
              </span>
            </div>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Created on {document.date}</p>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status quick adjustments */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Mark as:</span>
            {document.type === 'invoice' ? (
              <>
                <button
                  onClick={() => onUpdateStatus(document.id, 'paid')}
                  className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50 border border-emerald-100 rounded-md cursor-pointer transition"
                >
                  Paid
                </button>
                <button
                  onClick={() => onUpdateStatus(document.id, 'sent')}
                  className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-blue-700 hover:bg-blue-50 bg-blue-50/50 border border-blue-100 rounded-md cursor-pointer transition"
                >
                  Sent
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onUpdateStatus(document.id, 'accepted')}
                  className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50 border border-emerald-100 rounded-md cursor-pointer transition"
                >
                  Accepted
                </button>
                <button
                  onClick={() => onUpdateStatus(document.id, 'declined')}
                  className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-slate-700 hover:bg-slate-100 bg-slate-100/50 border border-slate-200 rounded-md cursor-pointer transition"
                >
                  Declined
                </button>
              </>
            )}
          </div>

          <button
            onClick={onEdit}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition"
          >
            Edit
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer transition shadow-sm shadow-red-100"
          >
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Main Print Area (Paper emulation) */}
      <div 
        id="print-area" 
        className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-md max-w-4xl mx-auto text-slate-800 space-y-8 bento-card"
      >
        
        {/* Document Header (Letterhead) */}
        <div className="flex flex-col md:flex-row md:justify-between items-start gap-6 border-b border-slate-200/60 pb-8">
          {/* Left: Issuer profile */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                {!logoFailed ? (
                  <img
                    src="/Logo.jpg"
                    alt={company.name}
                    className="h-12 w-auto object-contain rounded-lg"
                    onError={() => setLogoFailed(true)}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                    {company.name.charAt(0)}
                  </div>
                )}
                <h1 className="text-lg font-bold text-slate-950 tracking-tight font-sans">{company.name}</h1>
              </div>
              {company.taxId && (
                <span className="text-[9px] text-slate-500 font-extrabold uppercase font-mono bg-slate-50 border border-slate-200/40 px-2 py-0.5 rounded-md">
                  REG: {company.taxId}
                </span>
              )}
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <p className="max-w-xs leading-relaxed">{company.address}</p>
              <div className="flex flex-wrap gap-x-4 pt-1">
                {company.phone && <span className="flex items-center gap-1"><Phone size={10} /> {company.phone}</span>}
                {company.email && <span className="flex items-center gap-1"><Mail size={10} /> {company.email}</span>}
                {company.website && <span className="flex items-center gap-1"><Globe size={10} /> {company.website}</span>}
              </div>
            </div>
          </div>

          {/* Right: Meta document designation */}
          <div className="text-left md:text-right space-y-1">
            <h2 className="text-2xl font-black text-slate-950 uppercase tracking-widest font-sans">
              {document.type === 'invoice' ? 'TAX INVOICE' : 'QUOTATION'}
            </h2>
            <div className="text-xs font-mono text-slate-500 space-y-0.5">
              <p><strong className="text-slate-800">Doc Number:</strong> {document.number}</p>
              <p><strong className="text-slate-800">Date Issued:</strong> {document.date}</p>
              <p><strong className="text-slate-800">Payment Due:</strong> {document.dueDate}</p>
            </div>
          </div>
        </div>

        {/* Addresses / Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Client Details */}
          <div className="space-y-2 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 bento-card">
            <h3 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Billed To</h3>
            <div className="space-y-1">
              <p className="font-bold text-slate-900 text-sm">{client.name}</p>
              {client.company && <p className="font-bold text-red-600 uppercase text-[10px] tracking-wider">{client.company}</p>}
              <p className="text-slate-500 leading-relaxed max-w-xs">{client.address}</p>
              {client.phone && <p className="text-slate-400 pt-1"><strong>Phone:</strong> {client.phone}</p>}
              {client.email && <p className="text-slate-400"><strong>Email:</strong> {client.email}</p>}
              {client.taxId && <p className="text-slate-400"><strong>Tax/SST ID:</strong> {client.taxId}</p>}
            </div>
          </div>

          {/* Settlement / Banking details */}
          <div className="space-y-2 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 flex flex-col justify-between bento-card">
            <div>
              <h3 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Payment Settlement</h3>
              {company.bankAccounts && company.bankAccounts.length > 0 ? (
                <div className="space-y-3">
                  {company.bankAccounts.map((account, index) => (
                    <div key={account.id || index} className={`text-slate-600 text-xs ${index > 0 ? 'border-t border-slate-200/50 pt-2' : ''}`}>
                      {company.bankAccounts!.length > 1 && (
                        <p className="text-[8px] font-extrabold text-red-600 uppercase tracking-wider mb-0.5">Account #{index + 1}</p>
                      )}
                      <p><strong>Banker Name:</strong> {account.bankName}</p>
                      <p><strong>Account Holder:</strong> {account.bankHolder}</p>
                      <p className="font-mono font-bold text-slate-900"><strong>Account No:</strong> {account.bankAccount}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1 text-slate-600">
                  <p><strong>Banker Name:</strong> {company.bankName}</p>
                  <p><strong>Account Holder:</strong> {company.bankHolder}</p>
                  <p className="font-mono font-bold text-slate-900"><strong>Account No:</strong> {company.bankAccount}</p>
                </div>
              )}
            </div>
            
            {document.type === 'quotation' && (
              <p className="text-[9px] text-slate-400 italic">
                * Note: To proceed, please sign this document or provide a Purchase Order (PO).
              </p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bento-card">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Item Description</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                {taxSum > 0 && <th className="py-3 px-4 text-center">Tax</th>}
                <th className="py-3 px-4 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {document.items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/30">
                  <td className="py-3.5 px-4 font-mono text-slate-400">{index + 1}</td>
                  <td className="py-3.5 px-4 max-w-sm">
                    <p className="font-bold text-slate-900">{item.description}</p>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">{item.quantity}</td>
                  <td className="py-3.5 px-4 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                  {taxSum > 0 && (
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                      {item.taxRate > 0 ? `${item.taxRate}%` : '-'}
                    </td>
                  )}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation summary bottom block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          
          {/* Notes / Legal guidelines */}
          <div className="text-xs text-slate-500 space-y-2">
            <h4 className="font-bold text-slate-800">Terms & Standard Conditions</h4>
            <p className="leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 whitespace-pre-line text-[11px] bento-card">
              {document.notes}
            </p>
          </div>

          {/* Sum details */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-medium text-slate-500">
              <span>Subtotal Amount</span>
              <span className="font-mono text-slate-900 font-bold">{formatCurrency(subtotal)}</span>
            </div>
            
            {taxSum > 0 && (
              <div className="flex justify-between font-medium text-slate-500">
                <span>Total Tax Sum</span>
                <span className="font-mono text-slate-900 font-bold">+{formatCurrency(taxSum)}</span>
              </div>
            )}

            {discountAmount > 0 && (
              <div className="flex justify-between font-medium text-slate-500">
                <span>Applied Discount {document.discountType === 'percentage' ? `(${document.discountValue}%)` : ''}</span>
                <span className="font-mono text-slate-900 font-bold">-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            {document.shipping > 0 && (
              <div className="flex justify-between font-medium text-slate-500">
                <span>Shipping / Logistic Fee</span>
                <span className="font-mono text-slate-900 font-bold">+{formatCurrency(document.shipping)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-sm">
              <span className="font-bold text-slate-900 uppercase">Grand Total ({company.currency})</span>
              <span className="font-mono font-black text-slate-950 text-base">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Double Signature Row for validation */}
        <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs">
          <div className="space-y-12">
            <div className="border-b border-slate-200 w-3/4 mx-auto" />
            <p className="text-slate-500">Authorized Signature<br /><strong className="text-slate-800">{company.name}</strong></p>
          </div>
          <div className="space-y-12">
            <div className="border-b border-slate-200 w-3/4 mx-auto" />
            <p className="text-slate-500">Accepted & Confirmed By<br /><strong className="text-slate-800">{client.company || client.name}</strong></p>
          </div>
        </div>

      </div>

    </div>
  );
}
