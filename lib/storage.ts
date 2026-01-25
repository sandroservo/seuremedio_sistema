import { User, Medication, Order, DeliveryTask } from './types';

const STORAGE_KEYS = {
  user: 'seu-remedio-user',
  medications: 'seu-remedio-medications',
  orders: 'seu-remedio-orders',
  deliveries: 'seu-remedio-deliveries',
};

// Initialize with mock data
const MOCK_MEDICATIONS: Medication[] = [
  {
    id: '1',
    name: 'Dipirona 500mg',
    description: 'Analgésico e antitérmico',
    price: 15.90,
    category: 'Dor e Febre',
    requiresPrescription: false,
    stock: 100,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Losartana 50mg',
    description: 'Para pressão alta',
    price: 35.00,
    category: 'Pressão',
    requiresPrescription: true,
    stock: 50,
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Amoxicilina 500mg',
    description: 'Antibiótico',
    price: 22.50,
    category: 'Antibióticos',
    requiresPrescription: true,
    stock: 30,
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'Vitamina C 1000mg',
    description: 'Suplemento vitamínico',
    price: 18.90,
    category: 'Vitaminas',
    requiresPrescription: false,
    stock: 200,
    createdAt: new Date(),
  },
  {
    id: '5',
    name: 'Omeprazol 20mg',
    description: 'Para ácido estomacal',
    price: 28.00,
    category: 'Digestão',
    requiresPrescription: false,
    stock: 75,
    createdAt: new Date(),
  },
];

export function getMedications(): Medication[] {
  if (typeof window === 'undefined') return MOCK_MEDICATIONS;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.medications);
    return stored ? JSON.parse(stored) : MOCK_MEDICATIONS;
  } catch {
    return MOCK_MEDICATIONS;
  }
}

export function setMedications(medications: Medication[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.medications, JSON.stringify(medications));
}

export function getOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.orders);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function setOrders(orders: Order[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.user);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setUser(user: User | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.user);
  }
}

export function getDeliveries(): DeliveryTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.deliveries);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function setDeliveries(deliveries: DeliveryTask[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.deliveries, JSON.stringify(deliveries));
}
