'use client';

import * as React from 'react';
import { DollarSign, CreditCard, Wallet } from 'lucide-react';

interface FinancePaymentFieldsProps {
  paymentCondition: string;
  setPaymentCondition: (value: string) => void;
  totalValue?: string;
  setTotalValue?: (value: string) => void;
  downPayment?: string;
  setDownPayment?: (value: string) => void;
  installmentValues?: string[];
  setInstallmentValues?: (values: string[]) => void;
  installmentCount?: number;
  setInstallmentCount?: (n: number) => void;
  intervalDays?: number;
  setIntervalDays?: (n: number) => void;
  firstDueDate?: string;
  setFirstDueDate?: (value: string) => void;
}

const inputClass =
  'p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all';

const labelClass = 'text-sm font-semibold text-on-surface';

function formatCurrency(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrency(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

export function FinancePaymentFields({
  paymentCondition,
  setPaymentCondition,
  totalValue = '',
  setTotalValue,
  downPayment = '',
  setDownPayment,
  installmentValues = [],
  setInstallmentValues,
  installmentCount = 2,
  setInstallmentCount,
  intervalDays = 30,
  setIntervalDays,
  firstDueDate = '',
  setFirstDueDate,
}: FinancePaymentFieldsProps) {

  const isPrazo = paymentCondition === 'A prazo';
  const totalNum = parseCurrency(totalValue);
  const downNum = parseCurrency(downPayment);
  const remainingNum = Math.max(0, totalNum - downNum);
  const perInstallment =
    isPrazo && installmentCount > 0 && installmentValues.length === 0
      ? remainingNum / installmentCount
      : null;

  const handleInstallmentChange = (index: number, value: string) => {
    if (!setInstallmentValues) return;
    const next = [...installmentValues];
    next[index] = value;
    setInstallmentValues(next);
  };

  // Ajustar array de parcelas quando quantidade muda
  React.useEffect(() => {
    if (!setInstallmentValues || !isPrazo) return;
    setInstallmentValues(Array(installmentCount).fill(''));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installmentCount, isPrazo]);

  return (
    <>
      {/* Condição de Pagamento */}
      <div className="flex flex-col gap-2">
        <label className={labelClass}>Condição de Pagamento</label>
        <select
          name="paymentCondition"
          value={paymentCondition}
          onChange={(e) => setPaymentCondition(e.target.value)}
          className={inputClass}
        >
          <option value="À vista">À vista</option>
          <option value="A prazo">A prazo (parcelado)</option>
        </select>
      </div>

      {/* Valor Total */}
      <div className="flex flex-col gap-2">
        <label className={labelClass} htmlFor="totalValue">
          Valor Total <span className="text-error">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold text-sm">R$</span>
          <input
            id="totalValue"
            name="totalValue"
            type="text"
            inputMode="numeric"
            required
            placeholder="0,00"
            value={totalValue}
            onChange={(e) => setTotalValue?.(formatCurrency(e.target.value))}
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      {/* Campos específicos para "A prazo" */}
      {isPrazo && (
        <>
          {/* Número de parcelas + Intervalo em linha */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor="installments">Nº de Parcelas</label>
              <input
                id="installments"
                name="installments"
                type="number"
                min="2"
                max="60"
                required
                value={installmentCount}
                onChange={(e) => setInstallmentCount?.(Math.max(2, parseInt(e.target.value) || 2))}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} htmlFor="interval">Intervalo (dias)</label>
              <input
                id="interval"
                name="interval"
                type="number"
                min="1"
                required
                value={intervalDays}
                onChange={(e) => setIntervalDays?.(Math.max(1, parseInt(e.target.value) || 30))}
                className={inputClass}
              />
            </div>
          </div>

          {/* Valor de Entrada */}
          <div className="flex flex-col gap-2">
            <label className={labelClass} htmlFor="downPayment">
              Valor de Entrada <span className="text-on-surface-variant font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold text-sm">R$</span>
              <input
                id="downPayment"
                name="downPayment"
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={downPayment}
                onChange={(e) => setDownPayment?.(formatCurrency(e.target.value))}
                className={`${inputClass} pl-10`}
              />
            </div>
            {downNum > 0 && totalNum > 0 && (
              <p className="text-xs text-on-surface-variant">
                Valor restante a parcelar:{' '}
                <span className="font-semibold text-primary">
                  R$ {remainingNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </p>
            )}
          </div>

          {/* Parcelas individuais */}
          {installmentCount > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className={labelClass}>Valor das Parcelas</label>
                {perInstallment !== null && perInstallment > 0 && (
                  <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded-md">
                    Sugerido: R$ {perInstallment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / parcela
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {Array.from({ length: installmentCount }, (_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-on-surface-variant w-16 shrink-0">
                      {i === 0 && downNum > 0 ? 'Parcela 1' : `Parcela ${i + 1}`}
                    </span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold text-xs">R$</span>
                      <input
                        name={`installment_${i}`}
                        type="text"
                        inputMode="numeric"
                        placeholder={perInstallment !== null && perInstallment > 0 ? perInstallment.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                        value={installmentValues[i] || ''}
                        onChange={(e) => handleInstallmentChange(i, formatCurrency(e.target.value))}
                        className="w-full p-2.5 pl-9 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Data do Primeiro Vencimento */}
      <div className="flex flex-col gap-2">
        <label className={labelClass} htmlFor="firstDueDate">
          Data do Primeiro Vencimento
        </label>
        <input
          id="firstDueDate"
          name="firstDueDate"
          type="date"
          required
          value={firstDueDate}
          onChange={(e) => setFirstDueDate?.(e.target.value)}
          className={inputClass}
        />
      </div>
    </>
  );
}
