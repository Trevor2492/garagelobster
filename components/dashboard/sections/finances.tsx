import { daysBetween, formatDate, formatMoney, relativeDays } from "@/lib/garage/format";
import type { ISODate, Vehicle } from "@/lib/garage/types";
import { Editable } from "../editable";
import { dueTone, Field, FieldList, Panel, Pill, Stat, SubHeading } from "../fields";

export function FinancesSection({ vehicle, today }: { vehicle: Vehicle; today: ISODate }) {
  // Sections that don't exist yet render empty; saving any field creates them.
  const loan = vehicle.finances.loan ?? {};
  const insurance = vehicle.finances.insurance ?? {};
  const registration = vehicle.finances.registration ?? {};

  const paidPct =
    loan.originalAmount && loan.balance !== undefined
      ? Math.min(100, Math.max(0, Math.round(((loan.originalAmount - loan.balance) / loan.originalAmount) * 100)))
      : undefined;
  const due = (date: ISODate | undefined) =>
    date && <Pill tone={dueTone(daysBetween(today, date))}>{relativeDays(today, date)}</Pill>;
  const money = (n: number | undefined) => n !== undefined && formatMoney(n);
  const date = (d: ISODate | undefined) => d && formatDate(d, "short");

  return (
    <Panel>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Stat
          label="Next loan payment"
          value={formatMoney(loan.monthlyPayment)}
          hint={loan.nextPaymentDue && `Due ${formatDate(loan.nextPaymentDue, "short")}`}
        />
        <Stat
          label="Insurance expires"
          value={formatDate(insurance.expires, "short")}
          hint={insurance.expires && relativeDays(today, insurance.expires)}
        />
        <Stat
          label="Registration expires"
          value={formatDate(registration.expires, "short")}
          hint={registration.expires && relativeDays(today, registration.expires)}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div>
          <SubHeading>Loan</SubHeading>
          <FieldList>
            <Field label="Lender"><Editable field="loan.lender" value={loan.lender} /></Field>
            <Field label="Original amount">
              <Editable field="loan.original_amount" value={loan.originalAmount}>{money(loan.originalAmount)}</Editable>
            </Field>
            <Field label="Balance">
              <Editable field="loan.balance" value={loan.balance}>{money(loan.balance)}</Editable>
            </Field>
            <Field label="Monthly payment">
              <Editable field="loan.monthly_payment" value={loan.monthlyPayment}>{money(loan.monthlyPayment)}</Editable>
            </Field>
            <Field label="APR">
              <Editable field="loan.apr_percent" value={loan.aprPercent}>
                {loan.aprPercent !== undefined && `${loan.aprPercent}%`}
              </Editable>
            </Field>
            <Field label="Next payment">
              <span className="inline-flex flex-wrap items-center gap-2">
                <Editable field="loan.next_payment_due" value={loan.nextPaymentDue}>{date(loan.nextPaymentDue)}</Editable>
                {due(loan.nextPaymentDue)}
              </span>
            </Field>
            <Field label="Payoff">
              <Editable field="loan.payoff_date" value={loan.payoffDate}>{date(loan.payoffDate)}</Editable>
            </Field>
          </FieldList>
          {paidPct !== undefined && (
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
          )}
        </div>

        <div className="lg:border-l lg:pl-8">
          <SubHeading>Insurance</SubHeading>
          <FieldList>
            <Field label="Provider"><Editable field="insurance.provider" value={insurance.provider} /></Field>
            <Field label="Policy #" mono>
              <Editable field="insurance.policy_number" value={insurance.policyNumber} />
            </Field>
            <Field label="Premium">
              <span className="inline-flex flex-wrap items-baseline gap-x-1">
                <Editable field="insurance.premium" value={insurance.premium}>{money(insurance.premium)}</Editable>
                <span className="text-muted-foreground">/</span>
                <Editable field="insurance.premium_period" value={insurance.premiumPeriod} />
              </span>
            </Field>
            <Field label="Coverage"><Editable field="insurance.coverage" value={insurance.coverage} /></Field>
            <Field label="Expires">
              <span className="inline-flex flex-wrap items-center gap-2">
                <Editable field="insurance.expires" value={insurance.expires}>{date(insurance.expires)}</Editable>
                {due(insurance.expires)}
              </span>
            </Field>
          </FieldList>
        </div>

        <div className="lg:border-l lg:pl-8">
          <SubHeading>Registration</SubHeading>
          <FieldList>
            <Field label="State"><Editable field="registration.state" value={registration.state} /></Field>
            <Field label="Plate" mono><Editable field="vehicle.license_plate" value={vehicle.licensePlate} /></Field>
            <Field label="Fee">
              <Editable field="registration.fee" value={registration.fee}>{money(registration.fee)}</Editable>
            </Field>
            <Field label="Expires">
              <span className="inline-flex flex-wrap items-center gap-2">
                <Editable field="registration.expires" value={registration.expires}>{date(registration.expires)}</Editable>
                {due(registration.expires)}
              </span>
            </Field>
          </FieldList>
        </div>
      </div>
    </Panel>
  );
}
