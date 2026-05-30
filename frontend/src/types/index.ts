export type Role =
  | "FARMER"
  | "INSTITUTION"
  | "COOPERATIVE_MANAGER"
  | "ADMIN"
  | "GOVERNMENT_PARTNER";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  profileImageUrl?: string;
}

export interface Notification {
  id: string;
  type: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  createdAt: string;
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  sizeInHectares: number;
  soilType?: string;
  irrigationType?: string;
  createdAt: string;
}

export interface Livestock {
  id: string;
  type: string;
  purpose?: string;
  quantity: number;
  estimatedValue?: number;
}

export interface CreditScore {
  id: string;
  score: number;
  rating: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "VERY_POOR";
  calculatedAt: string;
  factorBreakdown?: Record<string, number>;
}

export interface LoanApplication {
  id: string;
  requestedAmount: number;
  purpose: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface Loan {
  id: string;
  amount: number;
  disbursedAmount: number;
  status: "APPROVED" | "DISBURSED" | "ACTIVE" | "COMPLETED" | "DEFAULTED";
  interestRate: number;
  termMonths: number;
  startDate?: string;
  endDate?: string;
}

export interface RepaymentSchedule {
  id: string;
  dueDate: string;
  amount: number;
  status: "PENDING" | "PAID" | "OVERDUE" | "PARTIAL";
  paidAt?: string;
  paidAmount?: number;
}

export interface Recommendation {
  id: string;
  type: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "UNREAD" | "READ" | "ACTED_ON";
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  skip: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
