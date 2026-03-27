import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import useStore from '../stores/useStore';
import { daysAgoCount } from '../utils/helpers';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { useTranslation } from '../i18n/useTranslation';
import useToastStore from '../stores/useToastStore';
import VisibilityPicker from '../components/ui/VisibilityPicker';
import type { Visibility } from '../types';

export default function Clients() {
  const { clients, addClient } = useStore();
  const { t } = useTranslation();
  const toast = useToastStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'inactive'>('recent');
  const [showAdd, setShowAdd] = useState(searchParams.get('action') === 'new');

  const [form, setForm] = useState({
    companyName: '', phone: '', responsiblePerson: '', responsiblePersonRole: '', status: 'prospect' as any,
    visibility: 'team' as Visibility, sharedWith: [] as string[],
  });

  const filtered = useMemo(() => {
    let result = clients.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.companyName.toLowerCase().includes(q) ||
          c.responsiblePerson.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.nextAction || '').toLowerCase().includes(q);
      }
      return true;
    });

    if (sortBy === 'name') result.sort((a, b) => a.companyName.localeCompare(b.companyName));
    else if (sortBy === 'recent') result.sort((a, b) => (b.lastInteractionAt || b.updatedAt).localeCompare(a.lastInteractionAt || a.updatedAt));
    else if (sortBy === 'inactive') result.sort((a, b) => (a.lastInteractionAt || a.createdAt).localeCompare(b.lastInteractionAt || b.createdAt));

    return result;
  }, [clients, statusFilter, search, sortBy]);

  const handleAdd = () => {
    if (!form.companyName.trim()) return;
    addClient({
      companyName: form.companyName,
      phone: form.phone,
      responsiblePerson: form.responsiblePerson,
      responsiblePersonRole: form.responsiblePersonRole || undefined,
      status: form.status,
      accountStatus: 'pending_creation',
      contractStatus: 'draft',
      onboardingStage: 'initial_contact',
      nextFollowUp: undefined,
      visibility: form.visibility,
      sharedWith: form.sharedWith,
    });
    setShowAdd(false);
    setSearchParams({});
    setForm({ companyName: '', phone: '', responsiblePerson: '', responsiblePersonRole: '', status: 'prospect', visibility: 'team', sharedWith: [] });
    toast.success(t.toast.clientCreated);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t.clients.title} <span className="text-base font-normal text-slate-400 ml-2">{clients.length}</span></h1>
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> {t.clients.addClient}</button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input name="search" className="input pl-9" placeholder={t.clients.searchClients} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select name="statusFilter" className="select w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">{t.clients.allStatuses}</option>
          <option value="active">{t.clients.active}</option>
          <option value="onboarding">{t.clients.onboarding}</option>
          <option value="at_risk">{t.clients.atRisk}</option>
          <option value="prospect">{t.clients.prospect}</option>
          <option value="paused">{t.clients.paused}</option>
          <option value="issue">{t.clients.issue}</option>
          <option value="churned">{t.clients.churned}</option>
        </select>
        <select name="sortBy" className="select w-40" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="recent">{t.crm.recentFirst}</option>
          <option value="inactive">{t.crm.oldestFirst}</option>
          <option value="name">A → Z</option>
        </select>
      </div>

      {/* Client Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400 font-medium">
              <th className="px-4 py-3">{t.clients.companyName}</th>
              <th className="px-4 py-3">{t.clients.responsiblePerson}</th>
              <th className="px-4 py-3">{t.clients.phone}</th>
              <th className="px-4 py-3">{t.common.status}</th>
              <th className="px-4 py-3">{t.crm.lastInteraction}</th>
              <th className="px-4 py-3">{t.crm.nextAction}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((client) => {
              const lastDays = daysAgoCount(client.lastInteractionAt);
              const isAtRisk = client.status === 'issue' || client.status === 'at_risk';

              return (
                <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/clients/${client.id}`} className="flex items-center gap-2 text-slate-900 font-medium hover:text-primary-700 transition-colors">
                      {isAtRisk && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
                      {client.companyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{client.responsiblePerson}</td>
                  <td className="px-4 py-3 text-slate-500">{client.phone}</td>
                  <td className="px-4 py-3"><StatusBadge status={client.status} /></td>
                  <td className="px-4 py-3">
                    {lastDays !== null && (
                      <span className={`text-xs ${lastDays > 7 ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                        {lastDays === 0 ? t.crm.today : `${lastDays}d`}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    {client.nextAction && (
                      <span className="text-xs text-slate-600 truncate block">{client.nextAction}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-sm text-slate-500">{t.clients.noClientsMatch}</div>
        )}
      </div>

      {/* Add Client Modal */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setSearchParams({}); }} title={t.clients.addNewClient}
        footer={<><button className="btn-secondary" onClick={() => { setShowAdd(false); setSearchParams({}); }}>{t.common.cancel}</button><button className="btn-primary" onClick={handleAdd}>{t.clients.addClient}</button></>}
      >
        <div className="space-y-4">
          <div>
            <label className="label">{t.clients.companyName} *</label>
            <input name="companyName" className="input" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="label">{t.clients.phone} *</label>
            <input name="phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+370..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t.clients.responsiblePerson} *</label>
              <input name="responsiblePerson" className="input" value={form.responsiblePerson} onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })} />
            </div>
            <div>
              <label className="label">{t.clients.responsiblePersonRole}</label>
              <input name="responsiblePersonRole" className="input" value={form.responsiblePersonRole} onChange={(e) => setForm({ ...form, responsiblePersonRole: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">{t.common.status}</label>
            <select name="status" className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="prospect">{t.clients.prospect}</option>
              <option value="onboarding">{t.clients.onboarding}</option>
              <option value="active">{t.clients.active}</option>
            </select>
          </div>
          <VisibilityPicker value={{ visibility: form.visibility, sharedWith: form.sharedWith }} onChange={(v) => setForm({ ...form, ...v })} />
        </div>
      </Modal>
    </div>
  );
}
