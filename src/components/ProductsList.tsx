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
  X 
} from 'lucide-react';

interface ProductsListProps {
  products: Product[];
  currency: string;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export default function ProductsList({
  products,
  currency,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}: ProductsListProps) {
  const [search, setSearch] = useState('');
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <button
          id="btn-add-product-main"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm shadow-red-100 cursor-pointer self-start"
        >
          <Plus size={14} /> Add Product / Service
        </button>
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

    </div>
  );
}
