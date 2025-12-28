
import { Product } from './types';

export const INITIAL_MARKETS = [
  "محلاوي الحي العاشر",
  "محلاوي التجمع الخامس",
  "محلاوي مارت فيل",
  "جمال سلامه الشيراتون",
  "جمال سلامه ميدان الجامع",
  "علوش ماركت",
  "محلاوي الطيران"
];

export const INITIAL_COMPANIES = [
  "شركة سوفت روز",
  "شركة فاين",
  "شركة زينة",
  "شركة بابيا فاميليا",
  "شركة وايت",
  "شركة كلاسي"
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'h1', name: 'مناديل السحب', category: 'facial', isHeader: true },
  { id: '1', name: 'Soft 500 single', category: 'facial' },
  { id: '2', name: 'Soft 600 single', category: 'facial' },
  { id: '3', name: 'Soft 400 31', category: 'facial' },
  { id: '4', name: 'Soft 500 31 (3ply)', category: 'facial' },
  { id: '5', name: 'Soft 500 (31) classic', category: 'facial' },
  { id: '6', name: 'Soft 500 (31) smart', category: 'facial' },
  { id: '7', name: 'Soft 600 (31) 3ply', category: 'facial' },
  { id: '8', name: 'New mazika 220 (41)', category: 'facial' },
  { id: '9', name: 'New Mazika 250 (51)', category: 'facial' },
  
  { id: 'h2', name: 'مناديل المطبخ', category: 'kitchen', isHeader: true },
  { id: '10', name: 'Kitchen 2 Rolls', category: 'kitchen' },
  { id: '11', name: 'Kitchen 4 Rolls', category: 'kitchen' },
  { id: '12', name: 'Kitchen 6 Rolls', category: 'kitchen' },
  { id: '13', name: '2 Rolls compress', category: 'kitchen' },
  { id: '14', name: '6 Rolls compress', category: 'kitchen' },
  { id: '15', name: 'Mega Roll L', category: 'kitchen' },
  { id: '16', name: 'Soft Rose XL', category: 'kitchen' },
  { id: '17', name: 'Soft Rose XXL', category: 'kitchen' },

  { id: 'h3', name: 'مناديل تواليت', category: 'toilet', isHeader: true },
  { id: '18', name: 'Soft 2 Hotels Jumbo', category: 'toilet' },
  { id: '19', name: 'Soft 2 Hotels mauve', category: 'toilet' },
  { id: '20', name: 'Soft 2 Hotel Compress', category: 'toilet' },
  { id: '21', name: 'Soft 6 Hotels Jumbo', category: 'toilet' },
  { id: '22', name: 'Soft 6 Hotels mauve', category: 'toilet' },
  { id: '23', name: 'Soft 6 Hotel Compress', category: 'toilet' },

  { id: 'h4', name: 'مناديل دولفن', category: 'dolphin', isHeader: true },
  { id: '24', name: 'Dolphin 2 Toilet Rolls', category: 'dolphin' },
  { id: '25', name: 'Dolphin 9 Toilet Rolls', category: 'dolphin' },
  { id: '26', name: 'Dolphin 18 Toilet Rolls', category: 'dolphin' },
  { id: '27', name: 'Dolphin 24 Toilet Rolls', category: 'dolphin' }
];
