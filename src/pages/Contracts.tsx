import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, FileText, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import useStore from '../stores/useStore';
import { formatDate, formatCurrency } from '../utils/helpers';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { useTranslation } from '../i18n/useTranslation';
import useToastStore from '../stores/useToastStore';
import VisibilityPicker from '../components/ui/VisibilityPicker';
import type { Visibility } from '../types';

export default function Contracts() {
  const { contracts, clients, addContract, updateContract } = useStore();
  const { t } = useTranslation();
  const toast = useToastStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(searchParams.get('action') === 'new');
  const [expanded, setExpanded] = useState<string | null>(null);

  const [form, setForm] = useState({
    clientId: '', contractNumber: '', type: 'Service Agreement', status: 'draft' as any,
    startDate: '', endDate: '', value: '', currency: 'EUR', notes: '', missingItems: '',
    visibility: 'team' as Visibility, sharedWith: [] as string[],
  });

  const filtered = useMemo(() => contracts.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.contractNumber.toLowerCase().includes(q) || c.clientName.toLowerCase().includes(q);
    }
    return true;
  }), [contracts, statusFilter, search]);

  const handleAdd = async () => {
    if (!form.clientId || !form.contractNumber) return;
    const client = clients.find(c => c.id === form.clientId);
    try {
      await addContract({
        clientId: form.clientId,
        clientName: client?.companyName || '',
        contractNumber: form.contractNumber,
        type: form.type,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        value: form.value ? Number(form.value) : undefined,
        currency: form.currency,
        documents: [],
        notes: form.notes,
        missingItems: form.missingItems.split('\n').map(i => i.trim()).filter(Boolean),
        visibility: form.visibility, sharedWith: form.sharedWith,
      });
      setShowAdd(false);
      setSearchParams({});
      setForm({ clientId: '', contractNumber: '', type: 'Service Agreement', status: 'draft', startDate: '', endDate: '', value: '', currency: 'EUR', notes: '', missingItems: '', visibility: 'team', sharedWith: [] });
      toast.success(t.toast.contractCreated);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t.contracts.title} <span className="text-base font-normal text-slate-500">({contracts.length})</span></h1>
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> {t.contracts.newContract}</button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input name="search" className="input pl-9" placeholder={t.contracts.searchContracts} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select name="statusFilter" className="select w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">{t.contracts.allStatuses}</option>
          <option value="draft">{t.contracts.draft}</option>
          <option value="in_progress">{t.contracts.inProgress}</option>
          <option value="waiting_info">{t.contracts.waitingInfo}</option>
          <option value="review">{t.contracts.underReview}</option>
          <option value="signed">{t.contracts.signed}</option>
        </select>
      </div>

      {/* Contracts Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.contracts.contractNumber}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.common.client}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.contracts.type}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.common.status}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.common.value}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.contracts.docs}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.contracts.missing}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(contract => (
              <>
                <tr key={contract.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setExpanded(expanded === contract.id ? null : contract.id)}>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{contract.contractNumber}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{contract.clientName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{contract.type}</td>
                  <td className="px-4 py-3"><StatusBadge status={contract.status} /></td>
                  <td className="px-4 py-3 text-sm text-slate-700">{contract.value ? formatCurrency(contract.value) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-slate-500">
                      {contract.documents.length}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {contract.missingItems.length > 0 && <span className="text-xs font-medium text-slate-600">{contract.missingItems.length}</span>}
                  </td>
                  <td className="px-4 py-3">{expanded === contract.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}</td>
                </tr>
                {expanded === contract.id && (
                  <tr key={`${contract.id}-detail`}>
                    <td colSpan={8} className="px-6 py-4 border-t border-slate-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase">{t.common.details}</h4>
                          <div className="space-y-1 text-sm">
                            <div><span className="text-slate-500">{t.contracts.start}:</span> {formatDate(contract.startDate)}</div>
                            <div><span className="text-slate-500">{t.contracts.end}:</span> {formatDate(contract.endDate)}</div>
                            <div><span className="text-slate-500">{t.common.notes}:</span> {contract.notes || '—'}</div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <select name="status" className="select text-xs w-36" value={contract.status}
                              onChange={async (e) => { await updateContract(contract.id, { status: e.target.value as any }); toast.success(t.toast.contractUpdated); }}
                              onClick={(e) => e.stopPropagation()}>
                              <option value="draft">{t.contracts.draft}</option>
                              <option value="in_progress">{t.contracts.inProgress}</option>
                              <option value="waiting_info">{t.contracts.waitingInfo}</option>
                              <option value="review">{t.contracts.underReview}</option>
                              <option value="signed">{t.contracts.signed}</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          {contract.documents.length > 0 && (
                            <div className="mb-3">
                              <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase">{t.common.documents}</h4>
                              {contract.documents.map(doc => (
                                <div key={doc.id} className="flex items-center gap-2 py-1 text-sm">
                                  <FileText size={14} className="text-slate-400" />
                                  <span>{doc.name}</span>
                                  <StatusBadge status={doc.status} size="sm" />
                                </div>
                              ))}
                            </div>
                          )}
                          {contract.missingItems.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase flex items-center gap-1"><AlertCircle size={12} /> {t.common.missingItems}</h4>
                              {contract.missingItems.map((item, i) => (
                                <div key={i} className="text-sm text-slate-600 py-0.5">• {item}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-slate-500">{t.contracts.noContractsMatch}</div>}
      </div>

      {/* Add Contract Modal */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setSearchParams({}); }} title={t.contracts.newContract} size="lg"
        footer={<><button className="btn-secondary" onClick={() => { setShowAdd(false); setSearchParams({}); }}>{t.common.cancel}</button><button className="btn-primary" onClick={handleAdd}>{t.contracts.createContract}</button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">{t.common.client} *</label>
              <select name="clientId" className="select" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                <option value="">{t.contracts.selectClient}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
              </select>
            </div>
            <div><label className="label">{t.contracts.contractNum} *</label><input name="contractNumber" className="input" value={form.contractNumber} onChange={(e) => setForm({ ...form, contractNumber: e.target.value })} placeholder="SVC-2024-XXX" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">{t.common.type}</label><input name="type" className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
            <div><label className="label">{t.common.status}</label>
              <select name="status" className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">{t.contracts.draft}</option><option value="in_progress">{t.contracts.inProgress}</option><option value="waiting_info">{t.contracts.waitingInfo}</option><option value="review">{t.contracts.underReview}</option><option value="signed">{t.contracts.signed}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="label">{t.contracts.startDate}</label><input name="startDate" className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><label className="label">{t.contracts.endDate}</label><input name="endDate" className="input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            <div><label className="label">{t.contracts.valueEur}</label><input name="value" className="input" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
          </div>
          <div><label className="label">{t.common.notes}</label><textarea name="notes" className="textarea" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div><label className="label">{t.contracts.missingItemsPerLine}</label><textarea name="missingItems" className="textarea" rows={3} placeholder="" value={form.missingItems} onChange={(e) => setForm({ ...form, missingItems: e.target.value })} /></div>
          <VisibilityPicker value={{ visibility: form.visibility, sharedWith: form.sharedWith }} onChange={(v) => setForm({ ...form, ...v })} />
        </div>
      </Modal>
    </div>
  );
}
