/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Document, Client } from '../types';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  FileText, 
  Plus, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';

interface DashboardHomeProps {
  documents: Document[];
  clients: Client[];
  currency: string;
  onNavigate: (tab: string) => void;
  onNewDoc: (type: 'quotation' | 'invoice') => void;
  onViewDoc: (docId: string) => void;
}

export default function DashboardHome({
  documents,
  clients,
  currency,
  onNavigate,
  onNewDoc,
  onViewDoc,
}: DashboardHomeProps) {
  
  // Calculations
  const invoices = documents.filter(doc => doc.type === 'invoice');
  const quotations = documents.filter(doc => doc.type === 'quotation');

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

  const totalInvoiced = invoices
    .filter(inv => inv.status !== 'draft')
    .reduce((sum, inv) => sum + calculateTotal(inv), 0);

  const totalCollected = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + calculateTotal(inv), 0);

  const totalOutstanding = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + calculateTotal(inv), 0);

  const activeQuotationsCount = quotations
    .filter(q => q.status === 'sent' || q.status === 'accepted')
    .length;

  const activeQuotationsValue = quotations
    .filter(q => q.status === 'sent' || q.status === 'accepted')
    .reduce((sum, q) => sum + calculateTotal(q), 0);

  // Format money helper
  const formatCurrency = (val: number) => {
    const isMMK = currency === 'MMK';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: isMMK ? 0 : 2,
      maximumFractionDigits: isMMK ? 0 : 2
    }).format(val);
  };

  // Recent 5 documents
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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

  // Custom Chart: Simple bar chart for sales last 6 months (simulated from our actual documents dates)
  // Let's bucket current documents by month in 2026
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = months.map((m, idx) => {
    const monthNum = idx + 1;
    // Filter paid + sent invoices for this month in 2026
    const monthInvoices = invoices.filter(inv => {
      const date = new Date(inv.date);
      return date.getMonth() === idx && date.getFullYear() === 2026 && inv.status !== 'draft';
    });
    const amount = monthInvoices.reduce((sum, inv) => sum + calculateTotal(inv), 0);
    return { name: m, amount };
  });

  // Find max monthly amount to scale SVG bars
  const maxAmount = Math.max(...monthlyData.map(d => d.amount), 5000);

  return (
    <div id="dashboard-home" className="space-y-6">
      {/* Welcome & Quick actions Bento Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs bento-card">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-1 block">Management Suite</span>
          <h2 className="text-xl font-sans font-bold text-slate-900 tracking-tight">Financial Overview</h2>
          <p className="text-slate-500 text-xs mt-1 max-w-xl">
            Monitor proposal conversion, track outstanding payments, and issue legal tax invoices with our structured bento ledger.
          </p>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <button
            id="btn-quick-new-quotation"
            onClick={() => onNewDoc('quotation')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition border border-slate-200 cursor-pointer shadow-2xs"
          >
            <Plus size={14} />
            Add Quote
          </button>
          <button
            id="btn-quick-new-invoice"
            onClick={() => onNewDoc('invoice')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shadow-sm shadow-indigo-100"
          >
            <Plus size={14} />
            New Invoice
          </button>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Total Invoiced */}
        <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-36 bento-card">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Invoiced</span>
            <div className="p-2 bg-slate-50 text-indigo-600 rounded-xl border border-slate-100">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-sans font-bold text-slate-900 tracking-tight">
              {formatCurrency(totalInvoiced)}
            </div>
            <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-wider font-semibold">Excludes draft status</p>
          </div>
        </div>

        {/* Total Collected */}
        <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-36 bento-card">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Received</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CheckCircle size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-sans font-bold text-emerald-600 tracking-tight">
              {formatCurrency(totalCollected)}
            </div>
            <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-wider font-semibold">
              {totalInvoiced > 0 
                ? `${Math.round((totalCollected / totalInvoiced) * 100)}% collection rate` 
                : 'No invoices yet'}
            </p>
          </div>
        </div>

        {/* Pending / Unpaid */}
        <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-36 bento-card">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pending / Unpaid</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-sans font-bold text-rose-600 tracking-tight">
              {formatCurrency(totalOutstanding)}
            </div>
            <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-wider font-semibold">Invoices awaiting payment</p>
          </div>
        </div>

        {/* Collection Rate / Performance Indicator (Aesthetic Visual Card matching the design HTML's bg-red-900 status card!) */}
        <div className="md:col-span-7 bg-red-950 rounded-2xl p-6 flex items-center justify-between overflow-hidden relative shadow-sm text-white min-h-[144px] bento-card">
          <div className="relative z-10 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-300 block">Performance Summary</span>
            <h3 className="text-2xl font-bold text-white tracking-tight leading-none">Collection Index</h3>
            <p className="text-red-200 text-xs max-w-sm leading-relaxed">Percentage of completed invoicing volumes successfully reconciled, closed, and paid in full.</p>
          </div>
          <div className="w-24 h-24 rounded-full border-[8px] border-red-900 border-t-red-400 relative z-10 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">
              {totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0}%
            </span>
          </div>
          {/* Abstract Background Glow */}
          <div className="absolute -right-10 -top-10 w-44 h-44 bg-red-500 blur-[80px] opacity-35 pointer-events-none"></div>
        </div>

        {/* Active Quotations Value */}
        <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-36 bento-card">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Proposals</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <FileText size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-sans font-bold text-slate-800 tracking-tight">
              {formatCurrency(activeQuotationsValue)}
            </div>
            <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-wider font-semibold">{activeQuotationsCount} quotes pending customer accepted status</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Container */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs bento-card">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Analytics</span>
          <h3 className="text-sm font-bold text-slate-900 mb-6">Invoiced Sales Trend (2026)</h3>
          
          {/* Custom SVG Bar Chart */}
          <div className="h-64 flex flex-col justify-end">
            <div className="flex items-end justify-between h-48 px-2">
              {monthlyData.map((data, idx) => {
                const heightPercentage = `${Math.max(4, (data.amount / maxAmount) * 100)}%`;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute mb-14 bg-slate-950 text-white text-xs py-1.5 px-2.5 rounded-lg shadow-lg transition duration-200 pointer-events-none transform -translate-y-2 z-10 font-mono border border-slate-800">
                      {formatCurrency(data.amount)}
                    </div>
                    {/* Bar */}
                    <div 
                      style={{ height: heightPercentage }} 
                      className="w-8 sm:w-10 bg-slate-50 border border-slate-100 group-hover:bg-red-600 group-hover:border-red-600 transition-all duration-300 rounded-t-lg relative cursor-pointer"
                    >
                      {data.amount > 0 && (
                        <div className="absolute inset-x-0 top-0 h-1 bg-red-500 rounded-t-lg" />
                      )}
                    </div>
                    {/* Label */}
                    <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider font-mono">{data.name}</span>
                  </div>
                );
              })}
            </div>
            {/* Legend line */}
            <div className="h-[1px] bg-slate-100 w-full mt-1" />
          </div>
        </div>

        {/* Recent Activity / Quick Documents List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col bento-card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Ledger</span>
              <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
            </div>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs text-red-600 hover:text-red-800 font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              See all <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto">
            {recentDocs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No recent documents found
              </div>
            ) : (
              recentDocs.map((doc) => {
                const docClient = clients.find(c => c.id === doc.clientId);
                return (
                  <div 
                     key={doc.id}
                    onClick={() => onViewDoc(doc.id)}
                    className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition border border-slate-100 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg border text-[10px] font-black tracking-wider uppercase shrink-0 ${
                        doc.type === 'invoice' 
                           ? 'bg-red-50 text-red-700 border-red-100' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {doc.type === 'invoice' ? 'INV' : 'QT'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs tracking-tight group-hover:text-red-600 transition">{doc.number}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[130px] sm:max-w-[180px]">
                          {docClient?.company || docClient?.name || 'Unknown Client'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-800 text-xs font-mono">
                        {formatCurrency(calculateTotal(doc))}
                      </div>
                      <span className={`inline-block px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest border mt-1 ${getStatusStyle(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
