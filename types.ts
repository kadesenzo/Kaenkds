
export enum OSStatus {
  ORCAMENTO = 'Orçamento',
  EM_ANDAMENTO = 'Em Execução',
  FINALIZADO = 'Finalizado',
  CANCELADO = 'Cancelado'
}

export enum PaymentStatus {
  PAGO = 'Pago',
  PENDENTE = 'Pendente',
  ATRASADO = 'Atrasado'
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum PaymentMethod {
  PIX = 'PIX',
  DINHEIRO = 'Dinheiro',
  CARTAO_CREDITO = 'Cartão de Crédito',
  CARTAO_DEBITO = 'Cartão de Débito',
  OUTRO = 'Outro'
}

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  method: PaymentMethod;
  description: string;
  relatedId?: string;
  date: string;
}

export enum SyncStatus {
  SYNCED = 'Synced',
  SYNCING = 'Syncing',
  OFFLINE = 'Offline',
  ERROR = 'Error'
}

export interface UserSession {
  username: string;
  activeUser: string;
  realUsername: string;
  role: 'Dono' | 'Funcionário' | 'Recepção';
  lastSync: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  shift: string;
  services: number;
  status: 'Ativo' | 'Inativo';
  createdAt: string;
}

export interface Part {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  document: string;
  observations: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  clientId: string;
  model: string;
  brand: string;
  year: string;
  plate: string;
  km: number;
  observations?: string;
}

export interface OSItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  type: 'PART' | 'SERVICE';
}

export interface ServiceOrder {
  id: string;
  osNumber: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleKm?: string;
  problem: string;
  items: OSItem[];
  laborValue: number;
  discount: number;
  totalValue: number;
  status: OSStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  observations?: string;
  dueDate?: string;
  billingHistory?: (
    | { date: string; amount: number; method: string }
    | { date: string; user: string; level: 'mild' | 'formal' | 'final' }
  )[];
  createdAt: string;
  updatedAt: string;
}

export interface VehicleChecklist {
  fuelLevel: string;
  damages: string[];
  items: Record<string, boolean>;
  observations: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  vehiclePlate: string;
  serviceType: string;
  date: string;
  time: string;
  status: string;
  attemptsCount: number;
  notes?: string;
}
