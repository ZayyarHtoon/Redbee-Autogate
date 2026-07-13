/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CompanyProfile, BankAccount } from '../types';
import { 
  Save, 
  Building, 
  CreditCard, 
  Settings, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Percent,
  Trash2,
  Plus
} from 'lucide-react';

interface CompanySettingsProps {
  profile: CompanyProfile;
  onSave: (updatedProfile: CompanyProfile) => void;
}

export default function CompanySettings({
  profile,
  onSave,
}: CompanySettingsProps) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [website, setWebsite] = useState(profile.website);
  const [address, setAddress] = useState(profile.address);
  const [taxId, setTaxId] = useState(profile.taxId);
  
  // Dynamic list of multiple accounts initialized from profile.bankAccounts or legacy values
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    if (profile.bankAccounts && profile.bankAccounts.length > 0) {
      return profile.bankAccounts;
    }
    return [
      {
        id: 'bank-1',
        bankName: profile.bankName || '',
        bankAccount: profile.bankAccount || '',
        bankHolder: profile.bankHolder || '',
      }
    ];
  });

  const [currency, setCurrency] = useState(profile.currency);
  const [defaultTaxRate, setDefaultTaxRate] = useState(profile.defaultTaxRate);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddBankAccount = () => {
    const newBank: BankAccount = {
      id: 'bank-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      bankName: '',
      bankAccount: '',
      bankHolder: '',
    };
    setBankAccounts([...bankAccounts, newBank]);
  };

  const handleDeleteBankAccount = (id: string) => {
    // Keep at least one bank account or allow deleting down to empty
    setBankAccounts(bankAccounts.filter(b => b.id !== id));
  };

  const handleBankFieldChange = (id: string, field: keyof Omit<BankAccount, 'id'>, value: string) => {
    setBankAccounts(
      bankAccounts.map(b => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Fallback/Legacy sync: use first bank account or empty strings
    const firstBank = bankAccounts[0] || { bankName: '', bankAccount: '', bankHolder: '' };

    onSave({
      name,
      email,
      phone,
      website,
      address,
      taxId,
      bankName: firstBank.bankName,
      bankAccount: firstBank.bankAccount,
      bankHolder: firstBank.bankHolder,
      bankAccounts,
      currency,
      defaultTaxRate: Number(defaultTaxRate),
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div id="company-settings-section" className="space-y-6 max-w-4xl">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1 block">Configurations</span>
        <h2 className="text-xl font-sans font-bold text-slate-900 tracking-tight">Business Profile & Settings</h2>
        <p className="text-slate-500 text-xs">Customize details that populate automatically on newly generated quotation & invoice layouts.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Row 1: General Business Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 bento-card">
          <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building size={14} className="text-red-600" /> General Business Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company / Entity Name *</label>
              <input
                id="profile-form-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Business Email Address *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail size={12} />
                </span>
                <input
                  id="profile-form-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Business Phone Number *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone size={12} />
                </span>
                <input
                  id="profile-form-phone"
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Website URL</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Globe size={12} />
                </span>
                <input
                  id="profile-form-website"
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SST ID / Tax Registration Number</label>
              <input
                id="profile-form-tax-id"
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">HQ / Billing Physical Address *</label>
              <div className="relative">
                <span className="absolute top-2.5 left-3 text-slate-400">
                  <MapPin size={12} />
                </span>
                <textarea
                  id="profile-form-address"
                  rows={3}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white resize-none leading-relaxed transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Financial Details & Banking */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 bento-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest flex items-center gap-2">
              <CreditCard size={14} className="text-red-600" /> Banking & Settlement Details
            </h3>
            <button
              type="button"
              onClick={handleAddBankAccount}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-800 transition cursor-pointer"
            >
              <Plus size={12} /> Add Bank Account
            </button>
          </div>

          {bankAccounts.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No bank accounts configured. Click "Add Bank Account" to configure payment options.
            </div>
          ) : (
            <div className="space-y-4">
              {bankAccounts.map((account, index) => (
                <div key={account.id} className="relative bg-slate-50/50 p-4 rounded-xl border border-slate-200/40 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Account #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteBankAccount(account.id)}
                      className="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer"
                      title="Delete Bank Account"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bank Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Maybank Berhad"
                        value={account.bankName}
                        onChange={(e) => handleBankFieldChange(account.id, 'bankName', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 focus:border-red-200 rounded-lg outline-hidden transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 5123 4567 8901"
                        value={account.bankAccount}
                        onChange={(e) => handleBankFieldChange(account.id, 'bankAccount', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 focus:border-red-200 rounded-lg outline-hidden font-mono transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Holder Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Redbee Autogate Sdn Bhd"
                        value={account.bankHolder}
                        onChange={(e) => handleBankFieldChange(account.id, 'bankHolder', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 focus:border-red-200 rounded-lg outline-hidden transition"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 3: Standard Defaults */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 bento-card">
          <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
            <Settings size={14} className="text-red-600" /> System Currency & Tax Defaults
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Default Base Currency *</label>
              <select
                id="profile-form-currency"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white font-semibold cursor-pointer transition"
              >
                <option value="MMK">Myanmar Kyat (K - MMK)</option>
                <option value="MYR">Malaysian Ringgit (RM - MYR)</option>
                <option value="USD">US Dollar ($ - USD)</option>
                <option value="SGD">Singapore Dollar (S$ - SGD)</option>
                <option value="EUR">Euro (€ - EUR)</option>
                <option value="GBP">British Pound (£ - GBP)</option>
                <option value="AUD">Australian Dollar (A$ - AUD)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Default Line-Item Tax Rate (%)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Percent size={12} />
                </span>
                <input
                  id="profile-form-tax-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={defaultTaxRate}
                  onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-transparent focus:border-slate-200 rounded-lg outline-hidden focus:bg-white font-mono transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save actions bar */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            id="btn-save-settings"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition shadow-sm shadow-red-100 cursor-pointer"
          >
            <Save size={13} /> Save Settings
          </button>
          
          {saveSuccess && (
            <span className="text-emerald-600 text-xs font-semibold animate-fade-in">
              Profile updated successfully! New documents will reflect these configurations.
            </span>
          )}
        </div>

      </form>
    </div>
  );
}
