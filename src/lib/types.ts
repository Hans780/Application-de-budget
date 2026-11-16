export type SplitMode = "equal" | "income";
export type ExpenseKind = "expense" | "income" | "refund";
export type ExpenseScope = "shared" | "personal";
export type ExpenseSource = "manual" | "webhook" | "recurring";

export interface Couple {
  id: string;
  name: string;
  invite_code: string;
  split_mode: SplitMode;
  default_total_budget: number;
  created_at: string;
}

export interface Profile {
  id: string;
  couple_id: string | null;
  display_name: string;
  monthly_income: number;
  created_at: string;
}

export interface Category {
  id: string;
  couple_id: string;
  name: string;
  emoji: string;
  color: string;
  sort_order: number;
  default_envelope: number;
  carry_over: boolean;
  is_fixed_charges: boolean;
  archived: boolean;
}

export interface MonthlyBudget {
  id: string;
  couple_id: string;
  month: string;
  total_amount: number;
}

export interface Envelope {
  id: string;
  couple_id: string;
  monthly_budget_id: string;
  category_id: string;
  amount: number;
}

export interface Expense {
  id: string;
  couple_id: string;
  paid_by: string;
  category_id: string | null;
  amount: number;
  kind: ExpenseKind;
  scope: ExpenseScope;
  merchant: string | null;
  note: string | null;
  occurred_at: string;
  source: ExpenseSource;
  card_name: string | null;
  refund_of: string | null;
  split_mode: "equal" | "income" | "custom" | null;
  split_payer_share: number | null;
  client_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OverviewCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  is_fixed_charges: boolean;
  envelope: number;
  spent: number;
  remaining: number;
}

export interface MonthOverview {
  month: string;
  today: string;
  total: number;
  spent: number;
  credits: number;
  remaining: number;
  days_left: number;
  per_day: number;
  categories: OverviewCategory[];
}
