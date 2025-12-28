
export enum AppTheme {
  LIGHT = 'light',
  DARK = 'dark',
  GLASS = 'glass',
  PROFESSIONAL_BLUE = 'professional_blue',
  PROFESSIONAL_GREEN = 'professional_green'
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export interface UserPermissions {
  showSalesLog: boolean;
  showInventoryLog: boolean;
  showCompetitorReports: boolean;
  showAllSales: boolean;
  allowViewOthersSales: boolean;
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  employeeName: string;
  employeeCode: string;
  phoneNumber: string;
  permissions: UserPermissions;
  isOnline?: boolean;
  vacationBalance?: VacationBalance;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  isHeader?: boolean;
}

export interface Market {
  id: string;
  name: string;
  createdBy: string;
  isPrivate?: boolean;
}

export interface SaleItem {
  productName: string;
  price: number;
  quantity: number;
}

export interface SaleRecord {
  id: string;
  marketName: string;
  items: SaleItem[];
  total: number;
  date: string;
  timestamp: number;
  createdBy: string;
  createdByName: string;
}

export interface InventoryRecord {
  id: string;
  marketName: string;
  items: { productName: string; quantity: number }[];
  date: string;
  timestamp: number;
  createdBy: string;
  createdByName: string;
}

export interface CompetitorPriceRecord {
  id: string;
  marketName: string;
  companyName: string;
  items: { productName: string; price: number }[];
  date: string;
  timestamp: number;
  createdBy: string;
}

export interface VacationBalance {
  annual: number;
  casual: number;
  sick: number;
  exams: number;
}

export interface VacationRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  days: number;
  type: 'annual' | 'casual' | 'sick' | 'exams';
  timestamp: number;
  monthPeriod: string; // e.g., "2025-11-21_2025-12-20"
}

export interface Notification {
  id: string;
  targetUserId: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  senderName?: string;
}

export interface GlobalSettings {
  appTitle: string;
  whatsapp: string;
  ticker: { text: string; showSales: boolean; active: boolean };
  sidebarVisibility: {
    salesLog: boolean;
    inventoryLog: boolean;
    competitorReports: boolean;
  };
}
