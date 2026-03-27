import { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';

const fmt = (n: number) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtCur = (n: number) => `€${fmt(n)}`;

export default function Tools() {
  const { t } = useTranslation();
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t.tools.title}</h1>
        <p className="text-sm text-slate-500 mt-1">{t.tools.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DiscountCalculator />
        <VATCalculator />
        <PercentageCalculator />
        <MarginCalculator />
        <DateCalculator />
        <PriceComparison />
      </div>
    </div>
  );
}

function DiscountCalculator() {
  const { t } = useTranslation();
  const [basePrice, setBasePrice] = useState<string>('1000');
  const [customDiscount, setCustomDiscount] = useState<string>('12');
  const [includeVat, setIncludeVat] = useState(false);
  const [vatRate, setVatRate] = useState<string>('21');
  const base = parseFloat(basePrice) || 0;
  const vat = parseFloat(vatRate) || 21;
  const tiers = [5, 10, 15, 20, 25, parseFloat(customDiscount) || 0];

  return (
    <div className="card p-5 lg:col-span-2">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">{t.tools.discountCalculator}</h2>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div><label className="label">{t.tools.basePrice}</label><input name="basePrice" className="input" type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} /></div>
        <div><label className="label">{t.tools.customDiscount}</label><input name="customDiscount" className="input" type="number" value={customDiscount} onChange={(e) => setCustomDiscount(e.target.value)} /></div>
        <div><label className="label">{t.tools.vatRate}</label><input name="vatRate" className="input" type="number" value={vatRate} onChange={(e) => setVatRate(e.target.value)} /></div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input name="includeVat" type="checkbox" checked={includeVat} onChange={(e) => setIncludeVat(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary-600" />
            <span className="text-sm text-slate-700">{t.tools.showWithVat}</span>
          </label>
        </div>
      </div>
      {base > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">{t.tools.discountPercent}</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">{t.tools.discountAmount}</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">{t.tools.finalPrice}</th>
                {includeVat && <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">{t.tools.withVat} ({vat}%)</th>}
                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">{t.tools.youSave}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tiers.filter(tier => tier > 0).map(pct => {
                const discountAmt = base * (pct / 100);
                const final_ = base - discountAmt;
                const withVat = final_ * (1 + vat / 100);
                return (
                  <tr key={pct} className={pct === (parseFloat(customDiscount) || 0) ? 'bg-primary-50' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-2 text-sm font-semibold text-slate-900">{pct}%</td>
                    <td className="px-4 py-2 text-sm text-right text-slate-700">{fmtCur(discountAmt)}</td>
                    <td className="px-4 py-2 text-sm text-right font-semibold text-slate-900">{fmtCur(final_)}</td>
                    {includeVat && <td className="px-4 py-2 text-sm text-right text-slate-700">{fmtCur(withVat)}</td>}
                    <td className="px-4 py-2 text-sm text-right text-success-600">{fmtCur(discountAmt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function VATCalculator() {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<string>('100');
  const [vatRate, setVatRate] = useState<string>('21');
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const amt = parseFloat(amount) || 0;
  const rate = parseFloat(vatRate) || 21;
  const net = mode === 'add' ? amt : amt / (1 + rate / 100);
  const vatAmt = mode === 'add' ? amt * (rate / 100) : amt - net;
  const gross = mode === 'add' ? amt + vatAmt : amt;

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">{t.tools.vatCalculator}</h2>
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setMode('add')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg ${mode === 'add' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>{t.tools.addVat}</button>
          <button onClick={() => setMode('remove')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg ${mode === 'remove' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>{t.tools.removeVat}</button>
        </div>
        <div><label className="label">{t.tools.amount}</label><input name="amount" className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div><label className="label">{t.tools.vatRate}</label><input name="vatRate" className="input" type="number" value={vatRate} onChange={(e) => setVatRate(e.target.value)} /></div>
        <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">{t.tools.netAmount}</span><span className="font-semibold text-slate-900">{fmtCur(net)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">{t.tools.vat} ({rate}%)</span><span className="font-semibold text-amber-600">{fmtCur(vatAmt)}</span></div>
          <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500">{t.tools.grossAmount}</span><span className="font-bold text-slate-900 text-base">{fmtCur(gross)}</span></div>
        </div>
      </div>
    </div>
  );
}

function PercentageCalculator() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'of' | 'is' | 'change'>('of');
  const [a, setA] = useState<string>('15');
  const [b, setB] = useState<string>('200');
  const result = (() => {
    const x = parseFloat(a) || 0;
    const y = parseFloat(b) || 0;
    if (mode === 'of') return y > 0 ? (x / 100) * y : 0;
    if (mode === 'is') return y > 0 ? (x / y) * 100 : 0;
    return x > 0 ? y / (1 + x / 100) : 0;
  })();

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">{t.tools.percentageCalculator}</h2>
      <div className="flex gap-1 mb-3">
        <button onClick={() => setMode('of')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg ${mode === 'of' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>{t.tools.xPercentOfY}</button>
        <button onClick={() => setMode('is')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg ${mode === 'is' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>{t.tools.xIsPercentOfY}</button>
        <button onClick={() => setMode('change')} className={`flex-1 py-1.5 text-xs font-medium rounded-lg ${mode === 'change' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>{t.tools.baseFromPercent}</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="label">{mode === 'of' ? t.tools.percentage : mode === 'is' ? t.common.value : t.tools.finalValue}</label><input name="valueA" className="input" type="number" value={a} onChange={(e) => setA(e.target.value)} /></div>
        <div><label className="label">{mode === 'of' ? t.tools.ofValue : mode === 'is' ? t.tools.total : t.tools.percentageApplied}</label><input name="valueB" className="input" type="number" value={b} onChange={(e) => setB(e.target.value)} /></div>
      </div>
      <div className="bg-slate-50 rounded-lg p-4 text-center">
        <div className="text-xs text-slate-500 mb-1">{t.tools.result}</div>
        <div className="text-2xl font-bold text-slate-900">{mode === 'is' ? `${fmt(result)}%` : fmtCur(result)}</div>
      </div>
    </div>
  );
}

function MarginCalculator() {
  const { t } = useTranslation();
  const [cost, setCost] = useState<string>('60');
  const [selling, setSelling] = useState<string>('100');
  const c = parseFloat(cost) || 0;
  const s = parseFloat(selling) || 0;
  const profit = s - c;
  const margin = s > 0 ? (profit / s) * 100 : 0;
  const markup = c > 0 ? (profit / c) * 100 : 0;

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">{t.tools.marginCalculator}</h2>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="label">{t.tools.costPrice}</label><input name="costPrice" className="input" type="number" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
        <div><label className="label">{t.tools.sellingPrice}</label><input name="sellingPrice" className="input" type="number" value={selling} onChange={(e) => setSelling(e.target.value)} /></div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">{t.tools.profit}</span><span className={`font-semibold ${profit >= 0 ? 'text-success-600' : 'text-danger-600'}`}>{fmtCur(profit)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">{t.tools.margin}</span><span className="font-semibold text-slate-900">{fmt(margin)}%</span></div>
        <div className="flex justify-between"><span className="text-slate-500">{t.tools.markup}</span><span className="font-semibold text-slate-900">{fmt(markup)}%</span></div>
      </div>
    </div>
  );
}

function DateCalculator() {
  const { t, lang } = useTranslation();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState<string>('30');
  const [bizOnly, setBizOnly] = useState(false);
  const [date1, setDate1] = useState(new Date().toISOString().split('T')[0]);
  const [date2, setDate2] = useState('');

  const resultDate = (() => {
    const start = new Date(startDate);
    let remaining = parseInt(days) || 0;
    if (!bizOnly) { start.setDate(start.getDate() + remaining); return start; }
    let dir = remaining >= 0 ? 1 : -1;
    remaining = Math.abs(remaining);
    while (remaining > 0) { start.setDate(start.getDate() + dir); const dow = start.getDay(); if (dow !== 0 && dow !== 6) remaining--; }
    return start;
  })();

  const daysBetween = (() => {
    if (!date1 || !date2) return null;
    return Math.round((new Date(date2).getTime() - new Date(date1).getTime()) / (1000 * 60 * 60 * 24));
  })();

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">{t.tools.dateCalculator}</h2>
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">{t.tools.startDate}</label><input name="startDate" className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
          <div><label className="label">{t.tools.addSubtractDays}</label><input name="days" className="input" type="number" value={days} onChange={(e) => setDays(e.target.value)} /></div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input name="bizOnly" type="checkbox" checked={bizOnly} onChange={(e) => setBizOnly(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary-600" />
          <span className="text-sm text-slate-700">{t.tools.businessDaysOnly}</span>
        </label>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-500">{t.tools.resultDate}</div>
          <div className="text-lg font-bold text-slate-900">{resultDate.toLocaleDateString(lang === 'lt' ? 'lt-LT' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>
      <div className="border-t border-slate-200 pt-3">
        <div className="text-xs font-semibold text-slate-700 mb-2">{t.tools.daysBetweenDates}</div>
        <div className="grid grid-cols-2 gap-3">
          <div><input name="date1" className="input" type="date" value={date1} onChange={(e) => setDate1(e.target.value)} /></div>
          <div><input name="date2" className="input" type="date" value={date2} onChange={(e) => setDate2(e.target.value)} /></div>
        </div>
        {daysBetween !== null && (
          <div className="text-center mt-2 text-sm font-semibold text-slate-900">{Math.abs(daysBetween)} {t.tools.days} {daysBetween < 0 ? t.tools.daysBefore : t.tools.daysAfter}</div>
        )}
      </div>
    </div>
  );
}

function PriceComparison() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([
    { name: 'Basic', price: '49', period: 'monthly' },
    { name: 'Pro', price: '450', period: 'yearly' },
    { name: 'Enterprise', price: '99', period: 'monthly' },
  ]);
  const normalized = plans.map(p => {
    const price = parseFloat(p.price) || 0;
    const monthly = p.period === 'yearly' ? price / 12 : price;
    const yearly = p.period === 'monthly' ? price * 12 : price;
    return { ...p, monthly, yearly };
  });
  const bestMonthly = Math.min(...normalized.map(p => p.monthly).filter(p => p > 0));

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">{t.tools.priceComparison}</h2>
      <div className="space-y-2 mb-4">
        {plans.map((plan, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input name="planName" className="input w-24" placeholder={t.clients.name} value={plan.name} onChange={(e) => { const p = [...plans]; p[i] = { ...p[i], name: e.target.value }; setPlans(p); }} />
            <input name="planPrice" className="input w-20" type="number" placeholder={t.common.value} value={plan.price} onChange={(e) => { const p = [...plans]; p[i] = { ...p[i], price: e.target.value }; setPlans(p); }} />
            <select name="planPeriod" className="select w-24" value={plan.period} onChange={(e) => { const p = [...plans]; p[i] = { ...p[i], period: e.target.value }; setPlans(p); }}>
              <option value="monthly">{t.tools.monthly}</option><option value="yearly">{t.tools.yearly}</option>
            </select>
            {plans.length > 2 && (
              <button className="text-slate-400 hover:text-danger-500 text-xs" onClick={() => setPlans(plans.filter((_, j) => j !== i))}>×</button>
            )}
          </div>
        ))}
        <button className="btn-ghost btn-sm text-xs" onClick={() => setPlans([...plans, { name: '', price: '', period: 'monthly' }])}>{t.tools.addPlan}</button>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
        {normalized.map((p, i) => (
          <div key={i} className={`flex justify-between items-center p-2 rounded ${p.monthly === bestMonthly && p.monthly > 0 ? 'bg-success-50 ring-1 ring-success-200' : ''}`}>
            <span className="font-medium text-slate-900">{p.name || `${t.tools.plan} ${i + 1}`}</span>
            <span className="text-slate-600">{fmtCur(p.monthly)}/mo</span>
            <span className="text-slate-600">{fmtCur(p.yearly)}/yr</span>
            {p.monthly === bestMonthly && p.monthly > 0 && <span className="badge-green text-[10px]">{t.tools.best}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
