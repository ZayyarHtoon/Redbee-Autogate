/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, Document } from '../types';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Trash2, 
  Edit, 
  FileText, 
  PlusCircle, 
  Building,
  X 
} from 'lucide-react';

interface ClientsListProps {
  clients: Client[];
  documents: Document[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onCreateDocForClient: (clientId: string, type: 'quotation' | 'invoice') => void;
}

export default function ClientsList({
  clients,
  documents,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onCreateDocForClient,
}: ClientsListProps) {
  const [search, setSearch] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');

  const openAddModal = () => {
    setEditingClient(null);
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setAddress('');
    setTaxId('');
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCompany(client.company || '');
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setAddress(client.address || '');
    setTaxId(client.taxId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingClient) {
      onUpdateClient({
        ...editingClient,
        name,
        company,
        email,
        phone,
        address,
        taxId,
      });
    } else {
      onAddClient({
        id: 'c-' + Date.now(),
        name,
        company,
        email,
        phone,
        address,
        taxId,
      });
    }
    setIsModalOpen(false);
  };

  const getClientDocStats = (clientId: string) => {
    const clientDocs = documents.filter(d => d.clientId === clientId);
    const invoices = clientDocs.filter(d => d.type === 'invoice');
    const quotations = clientDocs.filter(d => d.type === 'quotation');
    return {
      total: clientDocs.length,
      invoices: invoices.length,
      quotations: quotations.length,
    };
  };

  const filteredClients = clients.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || 
           c.company.toLowerCase().includes(q) || 
           c.email.toLowerCase().includes(q);
  });

  return (
    <div id="clients-list-section" className="space-y-6">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1 block">Registry</span>
          <h2 className="text-xl font-sans font-bold text-slate-900 tracking-tight">Clients Registry</h2>
          <p className="text-slate-500 text-xs">Manage contacts, billing addresses, and monitor transaction counts.</p>
        </div>
        <button
          id="btn-add-client-main"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm shadow-red-100 cursor-pointer self-start"
        >
          <Plus size={14} /> Add Client
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex gap-4 items-center bento-card">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search size={14} />
          </span>
          <input
            id="search-clients"
            type="text"
            placeholder="Search clients, company, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-200 rounded-xl outline-hidden transition"
          />
        </div>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200/80 bento-card">
            <p className="font-semibold text-slate-500 text-sm">No clients registered</p>
            <p className="text-xs text-slate-400 mt-1">Get started by clicking the "Add Client" button above.</p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const stats = getClientDocStats(client.id);
            return (
              <div 
                key={client.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-red-100 transition-all group bento-card"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-2 mb-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{client.name}</h3>
                      {client.company && (
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mt-1 truncate">
                          <Building size={11} /> {client.company}
                        </p>
                      )}
                    </div>
                    
                    {/* Tiny stats badge */}
                    <span className="bg-slate-50 border border-slate-200/40 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-widest shrink-0">
                      {stats.total} docs
                    </span>
                  </div>

                  {/* Core details */}
                  <div className="space-y-2 text-xs text-slate-500 border-t border-slate-100 pt-4">
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-slate-400 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-start gap-2">
                        <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed text-slate-500">{client.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {/* Create Quick Document */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onCreateDocForClient(client.id, 'quotation')}
                      className="text-[10px] font-extrabold uppercase tracking-widest text-red-600 hover:text-red-800 bg-red-50/50 hover:bg-red-50 px-2 py-1 rounded-md transition border border-red-100/30 cursor-pointer"
                    >
                      + Quote
                    </button>
                    <button
                      onClick={() => onCreateDocForClient(client.id, 'invoice')}
                      className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 hover:text-emerald-800 bg-emerald-50/50 hover:bg-emerald-50 px-2 py-1 rounded-md transition border border-emerald-100/30 cursor-pointer"
                    >
                      + Invoice
                    </button>
                  </div>

                  {/* Edit/Delete triggers - visible on mobile, hover-triggered on desktop */}
                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(client)}
                      title="Edit Client"
                      className="p-1.5 text-slate-500 hover:bg-slate-50 hover:text-red-600 rounded-lg border border-transparent hover:border-slate-150 transition cursor-pointer"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={() => onDeleteClient(client.id)}
                      title="Delete Client"
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Create / Edit Client */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingClient ? 'Edit Client Details' : 'Add New Client'}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Name *</label>
                  <input
                    id="client-form-name"
                    type="text"
                    required
                    placeholder="e.g. John Tan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company / Business Name</label>
                  <input
                    id="client-form-company"
                    type="text"
                    placeholder="e.g. Alpha Residence Management"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    id="client-form-email"
                    type="email"
                    placeholder="john@alpha.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    id="client-form-phone"
                    type="text"
                    placeholder="+60 12-345 6789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tax ID / SST Registration</label>
                  <input
                    id="client-form-tax-id"
                    type="text"
                    placeholder="e.g. REG-991823-V"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billing Address</label>
                  <textarea
                    id="client-form-address"
                    rows={3}
                    placeholder="Provide full billing address for document generation..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  {editingClient ? 'Update Details' : 'Add Client'}
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
