/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Document, Client, Product, DocItem, DocumentType, DocumentStatus, CompanyProfile } from '../types';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  UserPlus, 
  ShoppingBag,
  ArrowLeft,
  Calculator,
  ChevronDown,
  Percent
} from 'lucide-react';

export function generateNextDocNumber(documents: Document[], type: DocumentType): string {
  const now = new Date();
  const year = now.getFullYear();
  const typePrefix = type === 'invoice' ? 'INV' : 'QT';
  
  // Filter docs of the matching type
  const matchingDocs = documents.filter(doc => doc.type === type);
  
  let maxSuffix = 0;
  matchingDocs.forEach(doc => {
    // Expected format: PREFIX-YEAR-SUFFIX (e.g., INV-2026-001) or similar.
    // Let's split by '-' and try to extract the last part as a number.
    const parts = doc.number.split('-');
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const num = parseInt(lastPart, 10);
      if (!isNaN(num) && num > maxSuffix) {
        maxSuffix = num;
      }
    } else {
      // Fallback matching trailing digits
      const match = doc.number.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxSuffix) {
          maxSuffix = num;
        }
      }
    }
  });
  
  const nextSuffix = maxSuffix + 1;
  const suffixStr = String(nextSuffix).padStart(3, '0');
  return `${typePrefix}-${year}-${suffixStr}`;
}

interface DocumentBuilderProps {
  documentToEdit?: Document | null;
  clients: Client[];
  products: Product[];
  companyProfile: CompanyProfile;
  onSave: (doc: Document) => void;
  onCancel: () => void;
  onAddClientInline: (client: Client) => void;
  onAddProductInline: (product: Product) => void;
  documents: Document[];
}

export default function DocumentBuilder({
  documentToEdit,
  clients,
  products,
  companyProfile,
  onSave,
  onCancel,
  onAddClientInline,
  onAddProductInline,
  documents,
}: DocumentBuilderProps) {
  
  // Doc Type & Basic info
  const [docType, setDocType] = useState<DocumentType>('invoice');
  const [docNumber, setDocNumber] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState<DocumentStatus>('draft');
  const [notes, setNotes] = useState('');

  // Line items
  const [items, setItems] = useState<DocItem[]>([]);
  
  // Financial adjustments
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('flat');
  const [discountValue, setDiscountValue] = useState(0);
  const [shipping, setShipping] = useState(0);

  // Modals / Inline creates
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(0);

  // Initialize values
  useEffect(() => {
    if (documentToEdit) {
      setDocType(documentToEdit.type);
      setDocNumber(documentToEdit.number);
      setDate(documentToEdit.date);
      setDueDate(documentToEdit.dueDate);
      setClientId(documentToEdit.clientId);
      setStatus(documentToEdit.status);
      setNotes(documentToEdit.notes);
      setItems(documentToEdit.items);
      setDiscountType(documentToEdit.discountType);
      setDiscountValue(documentToEdit.discountValue);
      setShipping(documentToEdit.shipping);
    } else {
      // Create mode
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      const fourteenDaysLater = new Date();
      fourteenDaysLater.setDate(now.getDate() + 14);
      const dueStr = fourteenDaysLater.toISOString().split('T')[0];

      // Auto generate sequential document number
      const nextDocNumber = generateNextDocNumber(documents, docType);
      
      setDocType(docType);
      setDocNumber(nextDocNumber);
      setDate(todayStr);
      setDueDate(dueStr);
      setClientId(clients[0]?.id || '');
      setStatus('draft');
      setDiscountType('flat');
      setDiscountValue(0);
      setShipping(0);
      setItems([
        {
          id: 'item-' + Date.now() + '-0',
          description: '',
          quantity: 1,
          unitPrice: 0,
          taxRate: companyProfile.defaultTaxRate,
        }
      ]);

      if (docType === 'invoice') {
        setNotes('Payment terms: Within 14 days of invoice date. Thank you for your business!');
      } else {
        setNotes('Quotation valid for 30 days. Prices include standard installation where specified.');
      }
    }
  }, [documentToEdit]);

  // Handle doc type change for prefix in fresh documents
  const handleDocTypeChange = (type: DocumentType) => {
    setDocType(type);
    if (!documentToEdit) {
      const nextDocNumber = generateNextDocNumber(documents, type);
      setDocNumber(nextDocNumber);
      
      if (type === 'invoice') {
        setNotes('Payment terms: Within 14 days of invoice date. Thank you for your business!');
      } else {
        setNotes('Quotation valid for 30 days. Prices include standard installation where specified.');
      }
    }
  };

  // Line item manipulation
  const handleAddItem = () => {
    const newItem: DocItem = {
      id: 'item-' + Date.now() + '-' + items.length,
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: companyProfile.defaultTaxRate,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    } else {
      // Just clear the single item
      setItems([{
        id: 'item-' + Date.now() + '-0',
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: companyProfile.defaultTaxRate,
      }]);
    }
  };

  const handleUpdateItem = (id: string, updates: Partial<DocItem>) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    }));
  };

  // Select existing product/service to auto-fill item row
  const handleSelectProduct = (itemId: string, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      handleUpdateItem(itemId, {
        productId: prod.id,
        description: prod.name,
        unitPrice: prod.unitPrice,
        taxRate: prod.taxRate,
      });
    }
  };

  // Submit main doc
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Please select or create a client first.');
      return;
    }
    
    const validItems = items.filter(item => item.description.trim() !== '');
    if (validItems.length === 0) {
      alert('Please add at least one line item with a description.');
      return;
    }

    const docToSave: Document = {
      id: documentToEdit?.id || 'doc-' + Date.now(),
      type: docType,
      number: docNumber,
      date,
      dueDate,
      clientId,
      items: validItems,
      discountType,
      discountValue: Number(discountValue),
      shipping: Number(shipping),
      notes,
      status,
      companyProfile: companyProfile,
      convertedToInvoiceId: documentToEdit?.convertedToInvoiceId,
      convertedFromQuotationId: documentToEdit?.convertedFromQuotationId,
    };

    onSave(docToSave);
  };

  // Quick Inline Client Add
  const handleSaveInlineClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;

    const newClient: Client = {
      id: 'c-' + Date.now(),
      name: newClientName,
      company: newClientCompany,
      email: newClientEmail,
      phone: newClientPhone,
      address: newClientAddress,
    };

    onAddClientInline(newClient);
    setClientId(newClient.id);
    
    // reset form & hide
    setNewClientName('');
    setNewClientCompany('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientAddress('');
    setShowAddClient(false);
  };

  // Quick Inline Product Add
  const handleSaveInlineProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName) return;

    const newProduct: Product = {
      id: 'p-' + Date.now(),
      name: newProdName,
      description: newProdDesc,
      unitPrice: Number(newProdPrice),
      taxRate: companyProfile.defaultTaxRate,
    };

    onAddProductInline(newProduct);
    
    // reset form & hide
    setNewProdName('');
    setNewProdDesc('');
    setNewProdPrice(0);
    setShowAddProduct(false);
  };

  // Finance sums
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxSum = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
  
  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = subtotal * (discountValue / 100);
  } else {
    discountAmount = discountValue;
  }

  const grandTotal = Math.max(0, subtotal + taxSum - discountAmount + Number(shipping));

  const formatCurrency = (val: number) => {
    const isMMK = companyProfile.currency === 'MMK';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: companyProfile.currency,
      minimumFractionDigits: isMMK ? 0 : 2,
      maximumFractionDigits: isMMK ? 0 : 2
    }).format(val);
  };

  return (
    <div id="document-builder-section" className="space-y-6">
      {/* Back nav & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 text-slate-500 hover:text-red-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1 block">Contractor Engine</span>
          <h2 className="text-xl font-sans font-bold text-slate-900 tracking-tight">
            {documentToEdit ? `Edit ${docType === 'invoice' ? 'Invoice' : 'Quotation'}` : `Create New Document`}
          </h2>
          <p className="text-slate-500 text-xs">
            {documentToEdit ? `Modifying doc ${documentToEdit.number}` : 'Fill in the details to draft your new transaction.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Core Document Builder (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metadata Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 bento-card">
            
            {/* Type & Doc number row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Doc Type Selector (Only editable on Create mode) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Document Type</label>
                {documentToEdit ? (
                  <div className="w-full px-4 py-2 bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/40 capitalize">
                    {docType}
                  </div>
                ) : (
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/40">
                    <button
                      type="button"
                      onClick={() => handleDocTypeChange('quotation')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                        docType === 'quotation' 
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200/10' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Quotation
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDocTypeChange('invoice')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                        docType === 'invoice' 
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200/10' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Invoice
                    </button>
                  </div>
                )}
              </div>

              {/* Doc Number */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Document Number</label>
                <input
                  id="input-doc-number"
                  type="text"
                  required
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full px-4 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl outline-hidden focus:bg-white font-mono transition"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                <div className="relative">
                  <select
                    id="input-doc-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                    className="w-full pl-4 pr-8 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl outline-hidden focus:bg-white appearance-none font-bold cursor-pointer transition"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    {docType === 'invoice' ? (
                      <>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </>
                    ) : (
                      <>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                      </>
                    )}
                  </select>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 pointer-events-none">
                    <ChevronDown size={14} />
                  </span>
                </div>
              </div>

            </div>

            {/* Client & Date details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Client Dropdown */}
              <div className="md:col-span-1">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client</label>
                  <button
                    type="button"
                    onClick={() => setShowAddClient(true)}
                    className="text-[10px] text-red-600 hover:text-red-800 font-bold uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus size={11} /> New
                  </button>
                </div>
                <div className="relative">
                  <select
                    id="input-doc-client"
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full pl-4 pr-8 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl outline-hidden focus:bg-white appearance-none cursor-pointer transition font-medium"
                  >
                    <option value="" disabled>Select a client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 pointer-events-none">
                    <ChevronDown size={14} />
                  </span>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Issue Date</label>
                <input
                  id="input-doc-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl outline-hidden focus:bg-white cursor-pointer transition font-mono"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Due Date</label>
                <input
                  id="input-doc-due"
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl outline-hidden focus:bg-white cursor-pointer transition font-mono"
                />
              </div>

            </div>

          </div>

          {/* Line Items Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 bento-card">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest">Line Items</h3>
              <button
                type="button"
                onClick={() => setShowAddProduct(true)}
                className="text-[10px] text-red-600 hover:text-red-800 font-bold uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer"
              >
                <ShoppingBag size={11} /> Catalog Add
              </button>
            </div>

            {/* List Table */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <div 
                  key={item.id} 
                  className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-slate-50/50 p-4 rounded-xl border border-slate-200/40"
                >
                  
                  {/* Select Product dropdown or manually type */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex gap-2">
                      <select
                        id={`select-prod-item-${index}`}
                        value={item.productId || ''}
                        onChange={(e) => handleSelectProduct(item.id, e.target.value)}
                        className="w-1/3 px-3 py-1.5 text-[11px] bg-white border border-slate-200 rounded-lg outline-hidden cursor-pointer text-slate-600 font-medium"
                      >
                        <option value="">Load item...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      
                      <input
                        id={`input-desc-item-${index}`}
                        type="text"
                        placeholder="Item name / detailed description..."
                        required
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Pricing row */}
                  <div className="flex gap-2 w-full md:w-auto items-center">
                    
                    {/* Qty */}
                    <div className="w-16">
                      <input
                        id={`input-qty-item-${index}`}
                        type="number"
                        min="1"
                        step="any"
                        placeholder="Qty"
                        required
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, { quantity: Number(e.target.value) })}
                        className="w-full text-center px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-hidden"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="w-24">
                      <input
                        id={`input-price-item-${index}`}
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Price"
                        required
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(item.id, { unitPrice: Number(e.target.value) })}
                        className="w-full text-right px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-hidden font-mono"
                      />
                    </div>

                    {/* Tax Rate */}
                    <div className="w-16 flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden pr-1">
                      <input
                        id={`input-tax-item-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        placeholder="Tax"
                        required
                        value={item.taxRate}
                        onChange={(e) => handleUpdateItem(item.id, { taxRate: Number(e.target.value) })}
                        className="w-full text-center py-1.5 text-xs outline-hidden border-0"
                      />
                      <Percent size={10} className="text-slate-400" />
                    </div>

                    {/* Auto Total */}
                    <div className="w-24 text-right font-mono text-xs font-bold text-slate-800 px-2">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </div>

                    {/* Delete item */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-100"
                    >
                      <Trash2 size={12} />
                    </button>

                  </div>

                </div>
              ))}
            </div>

            {/* Add row trigger */}
            <button
              type="button"
              id="btn-add-item-row"
              onClick={handleAddItem}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-dashed border-slate-200 hover:border-red-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Add Line Item
            </button>
          </div>

          {/* Terms & Notes Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 bento-card">
            <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest">Notes & Payment Terms</h3>
            <textarea
              id="input-doc-notes"
              rows={4}
              placeholder="Provide banking info, payment rules, warranty scopes, or personal notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl outline-hidden focus:bg-white resize-y leading-relaxed text-slate-600 transition"
            />
          </div>

        </div>

        {/* Right Column: Financial Calculations & Client Briefing (1/3 width) */}
        <div className="space-y-6">
          
          {/* Summary Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 bento-card">
            <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Calculator size={14} className="text-red-600" /> Summary Calculations
            </h3>

            {/* Financial math block */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono text-slate-900 font-bold">{formatCurrency(subtotal)}</span>
              </div>
              
              {taxSum > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Tax Total</span>
                  <span className="font-mono text-slate-900 font-bold">{formatCurrency(taxSum)}</span>
                </div>
              )}

              {/* Discount selection */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Apply Discount</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/30">
                    <button
                      type="button"
                      onClick={() => setDiscountType('flat')}
                      className={`px-2 py-1 text-[9px] font-extrabold rounded-md cursor-pointer transition ${
                        discountType === 'flat' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-400'
                      }`}
                    >
                      Flat
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percentage')}
                      className={`px-2 py-1 text-[9px] font-extrabold rounded-md cursor-pointer transition ${
                        discountType === 'percentage' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-400'
                      }`}
                    >
                      %
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <input
                    id="input-discount-val"
                    type="number"
                    min="0"
                    step="any"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full text-right pr-12 pl-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-transparent focus:border-slate-200 rounded-lg outline-hidden font-mono transition"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-bold text-slate-400 pointer-events-none">
                    {discountType === 'percentage' ? '%' : companyProfile.currency}
                  </span>
                </div>
              </div>

              {/* Shipping fee */}
              <div className="pt-2 space-y-2">
                <label className="text-slate-500 font-bold text-[10px] uppercase tracking-wider block">Shipping / Delivery Fee</label>
                <div className="relative">
                  <input
                    id="input-shipping-val"
                    type="number"
                    min="0"
                    step="any"
                    value={shipping}
                    onChange={(e) => setShipping(Number(e.target.value))}
                    className="w-full text-right pr-12 pl-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-transparent focus:border-slate-200 rounded-lg outline-hidden font-mono transition"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-bold text-slate-400 pointer-events-none">
                    {companyProfile.currency}
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-4 border-t border-slate-150 flex justify-between items-center">
                <span className="text-slate-900 font-extrabold text-[10px] uppercase tracking-widest">Grand Total</span>
                <span className="font-mono text-lg font-black text-slate-950">{formatCurrency(grandTotal)}</span>
              </div>

            </div>

            {/* Core Action buttons */}
            <div className="pt-4 space-y-2">
              <button
                type="submit"
                id="btn-save-doc"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition shadow-sm shadow-red-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={14} /> Save Document
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl transition border border-slate-200/60 cursor-pointer"
              >
                Cancel / Back
              </button>
            </div>

          </div>

          {/* Selected Client Brief Details */}
          {clientId && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 bento-card">
              <h4 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Target Client Details</h4>
              {(() => {
                const c = clients.find(cl => cl.id === clientId);
                if (!c) return <p className="text-xs text-slate-400">Loading...</p>;
                return (
                  <div className="text-xs space-y-2 text-slate-600 leading-relaxed">
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">{c.name}</span>
                      {c.company && <span className="text-red-600 font-bold uppercase text-[10px] tracking-wider block">{c.company}</span>}
                    </div>
                    {c.email && <div><strong className="text-slate-400 uppercase text-[9px] tracking-wider">Email:</strong> {c.email}</div>}
                    {c.phone && <div><strong className="text-slate-400 uppercase text-[9px] tracking-wider">Phone:</strong> {c.phone}</div>}
                    {c.address && <div><strong className="text-slate-400 uppercase text-[9px] tracking-wider">Address:</strong> {c.address}</div>}
                    {c.taxId && <div><strong className="text-slate-400 uppercase text-[9px] tracking-wider">Tax ID:</strong> {c.taxId}</div>}
                  </div>
                );
              })()}
            </div>
          )}

        </div>

      </form>

      {/* MODAL: Add Client Inline */}
      {showAddClient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50">
              <h3 className="text-sm font-semibold text-slate-900">Add New Client</h3>
              <button
                type="button"
                onClick={() => setShowAddClient(false)}
                className="text-slate-400 hover:text-slate-700 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveInlineClient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Person Name</label>
                  <input
                    id="inline-client-name"
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company / Organization Name</label>
                  <input
                    id="inline-client-company"
                    type="text"
                    placeholder="e.g. Acme Corporation"
                    value={newClientCompany}
                    onChange={(e) => setNewClientCompany(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    id="inline-client-email"
                    type="email"
                    placeholder="john@example.com"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    id="inline-client-phone"
                    type="text"
                    placeholder="+60 12-345 6789"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billing Address</label>
                  <textarea
                    id="inline-client-address"
                    rows={2}
                    placeholder="Full physical address for printing..."
                    value={newClientAddress}
                    onChange={(e) => setNewClientAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Create Client
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddClient(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl transition border border-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Product Inline */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50">
              <h3 className="text-sm font-semibold text-slate-900">Add to Product Catalog</h3>
              <button
                type="button"
                onClick={() => setShowAddProduct(false)}
                className="text-slate-400 hover:text-slate-700 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveInlineProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product / Service Name</label>
                <input
                  id="inline-prod-name"
                  type="text"
                  required
                  placeholder="e.g. Autogate Remotes Set"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Standard Unit Price</label>
                <div className="relative">
                  <input
                    id="inline-prod-price"
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full text-right pr-12 pl-3 py-2 text-xs bg-slate-50 focus:bg-white border border-transparent focus:border-slate-100 rounded-lg outline-hidden font-mono"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-bold text-slate-400 pointer-events-none">
                    {companyProfile.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product Description</label>
                <textarea
                  id="inline-prod-desc"
                  rows={3}
                  placeholder="Detailed specifications, warranty information, etc..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white resize-none"
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Create Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl transition border border-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
