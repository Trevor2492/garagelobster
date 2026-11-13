import { daysBetween, formatDate, formatMoney, relativeDays } from "@/lib/garage/format";
import type { ISODate, Vehicle } from "@/lib/garage/types";
import { dueTone, Field, FieldList, Panel, Pill, Stat, SubHeading } from "../fields";

export function FinancesSection({ vehicle, today }: { vehicle: Vehicle; today: ISODate }) {
  const { loan, insurance, registration } = vehicle.finances;
  const paidPct = loan ? Math.round(((loan.originalAmount - loan.balance) / loan.originalAmount) * 100) : 0;
  const due = (date: ISODate) => (
    <Pill tone={dueTone(daysBetween(today, date))}>{relativeDays(today, date)}</Pill>
  );

  return (
    <Panel>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Stat
          label="Next loan payment"
          value={loan ? formatMoney(loan.monthlyPayment) : "—"}
          hint={loan && `Due ${formatDate(loan.nextPaymentDue, "short")}`}
        />
        <Stat
          label="Insurance expires"
          value={formatDate(insurance?.expires, "short")}
          hint={insurance?.expires && relativeDays(today, insurance.expires)}
        />
        <Stat
          label="Registration expires"
          value={formatDate(registration?.expires, "short")}
          hint={registration?.expires && relativeDays(today, registration.expires)}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {loan && (
          <div>
            <SubHeading>Loan</SubHeading>
            <FieldList>
              <Field label="Lender">{loan.lender}</Field>
              <Field label="Balance">{formatMoney(loan.balance)}</Field>
              <Field label="Monthly payment">{formatMoney(loan.monthlyPayment)}</Field>
              <Field label="APR">{loan.aprPercent}%</Field>
              <Field label="Next payment">
                <span className="mr-2">{formatDate(loan.nextPaymentDue, "short")}</span>
                {due(loan.nextPaymentDue)}
              </Field>
              <Field label="Payoff">{formatDate(loan.payoffDate, "short")}</Field>
            </FieldList>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{paidPct}% paid off</span>
                <span>{formatMoney(loan.originalAmount)}</span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={paidPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Loan paid off"
              >
                <div className="h-full rounded-full bg-foreground" style={{ width: `${paidPct}%` }} />
              </div>
            </div>
          </div>
        )}
        {insurance && (
          <div className="lg:border-l lg:pl-8">
            <SubHeading>Insurance</SubHeading>
            <FieldList>
              <Field label="Provider">{insurance.provider}</Field>
              <Field label="Policy #" mono>{insurance.policyNumber}</Field>
              <Field label="Premium">{formatMoney(insurance.premium)} / {insurance.premiumPeriod}</Field>
              <Field label="Coverage">{insurance.coverage}</Field>
              <Field label="Expires">
                <span className="mr-2">{formatDate(insurance.expires, "short")}</span>
                {due(insurance.expires)}
              </Field>
            </FieldList>
          </div>
        )}
        {registration && (
          <div className="lg:border-l lg:pl-8">
            <SubHeading>Registration</SubHeading>
            <FieldList>
              <Field label="State">{registration.state}</Field>
              <Field label="Plate" mono>{vehicle.licensePlate}</Field>
              <Field label="Fee">{formatMoney(registration.fee)}</Field>
              <Field label="Expires">
                <span className="mr-2">{formatDate(registration.expires, "short")}</span>
                {due(registration.expires)}
              </Field>
            </FieldList>
          </div>
        )}
      </div>
    </Panel>
  );
}
