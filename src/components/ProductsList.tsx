/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  ShoppingBag,
  DollarSign,
  Percent,
  X,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ProductsListProps {
  products: Product[];
  currency: string;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onBulkSyncProducts?: (products: Product[], replace: boolean) => Promise<void>;
}

// --- GOOGLE SHEETS CSV PARSER UTILITIES ---

function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentToken = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      row.push(currentToken.trim());
      lines.push(row);
      row = [];
      currentToken = '';
    } else {
      currentToken += char;
    }
  }
  if (currentToken || row.length > 0) {
    row.push(currentToken.trim());
    lines.push(row);
  }
  return lines.filter(r => r.length > 0 && r.some(cell => cell !== ''));
}

function parseGoogleSheetCSV(csvText: string): Product[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().trim());
  
  // Find indices for each field
  const nameIdx = headers.findIndex(h => h.includes('name') || h === 'title' || h === 'item' || h === 'product' || h === 'service');
  const descIdx = headers.findIndex(h => h.includes('desc') || h === 'details' || h === 'info' || h === 'specifications');
  const priceIdx = headers.findIndex(h => h.includes('price') || h === 'cost' || h === 'rate' || h.includes('unitprice'));
  const taxIdx = headers.findIndex(h => h.includes('tax') || h.includes('vat'));

  const parsedProducts: Product[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const name = nameIdx > -1 ? row[nameIdx] : row[0]; // fallback to first column if no name column found
    if (!name || name.trim() === '') continue; // Skip rows without name

    const description = descIdx > -1 ? row[descIdx] : '';
    
    let priceVal = 0;
    if (priceIdx > -1 && row[priceIdx]) {
      // Strip currency symbols and commas
      const rawPrice = row[priceIdx].replace(/[^0-9.-]/g, '');
      priceVal = parseFloat(rawPrice) || 0;
    } else {
      // Try to find a numeric value in the row as fallback price
      for (const cell of row) {
        const cleaned = cell.replace(/[^0-9.-]/g, '');
        const num = parseFloat(cleaned);
        if (!isNaN(num) && num > 0) {
          priceVal = num;
          break;
        }
      }
    }

    let taxVal = 0;
    if (taxIdx > -1 && row[taxIdx]) {
      const rawTax = row[taxIdx].replace(/[^0-9.-]/g, '');
      taxVal = parseFloat(rawTax) || 0;
    }

    parsedProducts.push({
      id: 'p-gs-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: name.trim(),
      description: description.trim(),
      unitPrice: priceVal,
      taxRate: taxVal
    });
  }

  return parsedProducts;
}

export default function ProductsList({
  products,
  currency,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkSyncProducts,
}: ProductsListProps) {
  const [search, setSearch] = useState('');
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Google Sheets sync state
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [syncOption, setSyncOption] = useState<'merge' | 'replace'>('merge');
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetPreview, setSheetPreview] = useState<Product[]>([]);
  const [sheetError, setSheetError] = useState('');
  const [syncSuccessMessage, setSyncSuccessMessage] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  const openAddModal = () => {
    setEditingProd(null);
    setName('');
    setDescription('');
    setUnitPrice(0);
    setTaxRate(0);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProd(prod);
    setName(prod.name);
    setDescription(prod.description);
    setUnitPrice(prod.unitPrice);
    setTaxRate(prod.taxRate);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingProd) {
      onUpdateProduct({
        ...editingProd,
        name,
        description,
        unitPrice: Number(unitPrice),
        taxRate: Number(taxRate),
      });
    } else {
      onAddProduct({
        id: 'p-' + Date.now(),
        name,
        description,
        unitPrice: Number(unitPrice),
        taxRate: Number(taxRate),
      });
    }
    setIsModalOpen(false);
  };

  const handleFetchSheet = async () => {
    if (!sheetUrl) {
      setSheetError('Please enter a valid Google Sheets URL.');
      return;
    }

    setIsLoadingSheet(true);
    setSheetError('');
    setSheetPreview([]);
    setSyncSuccessMessage('');

    try {
      let fetchUrl = '';
      
      // Check if it's a published web link
      if (sheetUrl.includes('/pubhtml') || sheetUrl.includes('/pub')) {
        fetchUrl = sheetUrl.replace('/pubhtml', '/pub').split('?')[0] + '?output=csv';
      } else {
        // Extract spreadsheet ID
        const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
          throw new Error('Could not parse Google Sheets ID. Please ensure the link is correct.');
        }
        const sheetId = match[1];
        
        // Try to get specific gid (sheet tab) if available
        let gidParam = '';
        const gidMatch = sheetUrl.match(/[#&]gid=([0-9]+)/);
        if (gidMatch) {
          gidParam = `&gid=${gidMatch[1]}`;
        }
        
        fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}`;
      }

      console.log('Fetching sheet from URL:', fetchUrl);
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch the sheet. Please make sure the sheet sharing is set to "Anyone with the link can view".');
      }

      const csvText = await response.text();
      const parsed = parseGoogleSheetCSV(csvText);

      if (parsed.length === 0) {
        throw new Error('No products found in the sheet. Please make sure your sheet is not empty and has a header row.');
      }

      setSheetPreview(parsed);
    } catch (err: any) {
      console.error(err);
      setSheetError(err.message || 'An error occurred while fetching the Google Sheet.');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleImportSheetData = async () => {
    if (sheetPreview.length === 0 || !onBulkSyncProducts) return;

    setIsLoadingSheet(true);
    try {
      await onBulkSyncProducts(sheetPreview, syncOption === 'replace');
      setSyncSuccessMessage(`Successfully synchronized ${sheetPreview.length} items from Google Sheet!`);
      setSheetPreview([]);
      setSheetUrl('');
      setTimeout(() => {
        setIsSheetsModalOpen(false);
        setSyncSuccessMessage('');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setSheetError('Failed to import products to database.');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const filteredProds = products.filter(p => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || 
           p.description.toLowerCase().includes(q);
  });

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
    <div id="products-list-section" className="space-y-6">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1 block">Catalog</span>
          <h2 className="text-xl font-sans font-bold text-slate-900 tracking-tight">Products & Services Catalog</h2>
          <p className="text-slate-500 text-xs">Organize standard repair packages, hardware items, and hourly servicing fees.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => {
              setSheetUrl('');
              setSheetError('');
              setSheetPreview([]);
              setSyncSuccessMessage('');
              setIsSheetsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" /> Link Google Sheet
          </button>
          <button
            id="btn-add-product-main"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm shadow-red-100 cursor-pointer"
          >
            <Plus size={14} /> Add Product / Service
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex gap-4 items-center bento-card">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search size={14} />
          </span>
          <input
            id="search-products"
            type="text"
            placeholder="Search catalog items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-200 rounded-xl outline-hidden transition"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProds.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200/80 bento-card">
            <p className="font-semibold text-slate-500 text-sm">Catalog is empty</p>
            <p className="text-xs text-slate-400 mt-1">Get started by creating standard line items for instant document population.</p>
          </div>
        ) : (
          filteredProds.map((prod) => (
            <div 
              key={prod.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-red-100 transition-all group bento-card"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="p-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-200/40">
                    <ShoppingBag size={14} />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {formatCurrency(prod.unitPrice)}
                    </div>
                    {prod.taxRate > 0 && (
                      <span className="text-[9px] bg-red-50/50 border border-red-100/30 text-red-700 font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-sm mt-1 inline-block">
                        +{prod.taxRate}% tax
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-xs mb-1.5 group-hover:text-red-600 transition truncate-3-lines">
                  {prod.name}
                </h3>
                
                {prod.description && (
                  <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3">
                    {prod.description}
                  </p>
                )}
              </div>

              {/* Actions row - visible on mobile, hover-triggered on desktop */}
              <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(prod)}
                  title="Edit Product"
                  className="p-1.5 text-slate-500 hover:bg-slate-50 hover:text-red-600 rounded-lg border border-transparent hover:border-slate-150 transition cursor-pointer"
                >
                  <Edit size={12} />
                </button>
                <button
                  onClick={() => onDeleteProduct(prod.id)}
                  title="Delete Product"
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* MODAL: Create / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingProd ? 'Edit Catalog Item' : 'New Catalog Item'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Name *</label>
                <input
                  id="product-form-name"
                  type="text"
                  required
                  placeholder="e.g. Swing Arm Motor Module"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unit Price ({currency}) *</label>
                  <input
                    id="product-form-price"
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full text-right px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tax Rate (%)</label>
                  <div className="relative">
                    <input
                      id="product-form-tax"
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full text-right pr-8 pl-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white font-mono"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description / Specifications</label>
                <textarea
                  id="product-form-desc"
                  rows={4}
                  placeholder="Provide technical attributes, package contents, parts numbers, or scope of labor..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white resize-none leading-relaxed"
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  {editingProd ? 'Update Item' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl transition border border-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Google Sheets Integration */}
      {isSheetsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-600" size={18} />
                <h3 className="text-sm font-bold text-slate-900">
                  Google Sheets Catalog Link
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSheetsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Instructions */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-2 text-[11px] text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[9px]">How to Link Your Sheet:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>In Google Sheets, click the <strong className="text-slate-900">Share</strong> button at the top right.</li>
                  <li>Change general access to <strong className="text-slate-900">"Anyone with the link can view"</strong> (viewer access).</li>
                  <li>Ensure your spreadsheet has column headers (e.g., <strong className="font-mono text-slate-900">Name</strong>, <strong className="font-mono text-slate-900">Description</strong>, <strong className="font-mono text-slate-900">Price</strong>, <strong className="font-mono text-slate-900">Tax Rate</strong>).</li>
                  <li>Copy and paste your spreadsheet URL below.</li>
                </ol>
              </div>

              {/* URL Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spreadsheet Link *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200/60 focus:border-emerald-200 rounded-xl outline-hidden focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={handleFetchSheet}
                    disabled={isLoadingSheet}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    {isLoadingSheet ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      'Load Preview'
                    )}
                  </button>
                </div>
              </div>

              {/* Status Notifications */}
              {sheetError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Sync failed</p>
                    <p className="text-[11px] opacity-90 mt-0.5">{sheetError}</p>
                  </div>
                </div>
              )}

              {syncSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
                  <Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-semibold">Sync Successful</p>
                    <p className="text-[11px] opacity-90 mt-0.5">{syncSuccessMessage}</p>
                  </div>
                </div>
              )}

              {/* Preview Section */}
              {sheetPreview.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      Preview ({sheetPreview.length} items found)
                    </h4>
                  </div>
                  
                  <div className="border border-slate-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-50">
                    {sheetPreview.map((item, index) => (
                      <div key={index} className="p-2.5 flex justify-between items-center text-xs hover:bg-slate-50 transition">
                        <div className="truncate pr-4 flex-1">
                          <p className="font-bold text-slate-800 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{item.description || 'No description'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono font-semibold text-slate-900">{formatCurrency(item.unitPrice)}</p>
                          {item.taxRate > 0 && (
                            <p className="text-[9px] text-rose-500 font-bold">+{item.taxRate}% tax</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Import Strategy Selection */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sync Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`p-3 border rounded-xl flex items-start gap-2.5 cursor-pointer transition ${syncOption === 'merge' ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200/60 hover:bg-slate-50'}`}>
                        <input
                          type="radio"
                          name="syncOption"
                          value="merge"
                          checked={syncOption === 'merge'}
                          onChange={() => setSyncOption('merge')}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Merge & Update</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Merge with your existing catalog items.</p>
                        </div>
                      </label>
                      <label className={`p-3 border rounded-xl flex items-start gap-2.5 cursor-pointer transition ${syncOption === 'replace' ? 'border-amber-500 bg-amber-50/20' : 'border-slate-200/60 hover:bg-slate-50'}`}>
                        <input
                          type="radio"
                          name="syncOption"
                          value="replace"
                          checked={syncOption === 'replace'}
                          onChange={() => setSyncOption('replace')}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Overwrite All</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight text-amber-600">Completely replace your existing catalog.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-2">
              {sheetPreview.length > 0 && (
                <button
                  type="button"
                  onClick={handleImportSheetData}
                  disabled={isLoadingSheet}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer flex justify-center items-center gap-1.5"
                >
                  {isLoadingSheet && <Loader2 size={12} className="animate-spin" />}
                  Confirm Sync & Save
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSheetsModalOpen(false)}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition border border-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
