import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { IFoodService } from '../lib/ifood';
import type { 
  IFoodOrder, 
  IFoodIntegrationConfig, 
  IFoodOrderSummary 
} from '../types/ifood';

type IFoodState = {
  // Estado da integração
  integrationConfig: IFoodIntegrationConfig | null;
  isIntegrationActive: boolean;
  integrationStatus: 'idle' | 'loading' | 'connected' | 'error';
  
  // Pedidos
  orders: IFoodOrder[];
  currentOrder: IFoodOrder | null;
  ordersLoading: boolean;
  
  // Analytics
  salesSummary: IFoodOrderSummary | null;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  
  // Ações
  configureIntegration: (config: IFoodIntegrationConfig) => Promise<void>;
  getIntegrationConfig: () => Promise<void>;
  syncCatalog: (products: { id: string; name: string; description?: string; price: number; category: string; available: boolean; imageUrl?: string }[]) => Promise<void>;
  getOrders: (params?: { limit?: number }) => Promise<void>;
  getOrderById: (orderId: string) => Promise<void>;
  confirmOrder: (orderId: string, estimatedTime?: number) => Promise<void>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  dispatchOrder: (orderId: string) => Promise<void>;
  getSalesSummary: (params?: { groupBy?: 'day' | 'week' | 'month'; startDate?: string; endDate?: string }) => Promise<void>;
  getTopProducts: (params?: { limit?: number }) => Promise<void>;
  testWebhook: () => Promise<void>;
  getIntegrationStatus: () => Promise<void>;
};

const ifoodStoreCreator: StateCreator<IFoodState> = (set, get) => ({
  // Estado inicial
  integrationConfig: null,
  isIntegrationActive: false,
  integrationStatus: 'idle',
  orders: [],
  currentOrder: null,
  ordersLoading: false,
  salesSummary: null,
  topProducts: [],

  // Configurar integração
  async configureIntegration(config: IFoodIntegrationConfig) {
    set({ integrationStatus: 'loading' });
    try {
      await IFoodService.configureIntegration(config);
      set({ 
        integrationConfig: config,
        isIntegrationActive: true,
        integrationStatus: 'connected'
      });
    } catch (error) {
      set({ integrationStatus: 'error' });
      throw error;
    }
  },

  // Obter configuração
  async getIntegrationConfig() {
    set({ integrationStatus: 'loading' });
    try {
      const config = await IFoodService.getIntegrationConfig();
      set({ 
        integrationConfig: config,
        isIntegrationActive: config?.isActive || false,
        integrationStatus: 'connected'
      });
    } catch (error) {
      set({ integrationStatus: 'error' });
      throw error;
    }
  },

  // Sincronizar catálogo
  async syncCatalog(products: { id: string; name: string; description?: string; price: number; category: string; available: boolean; imageUrl?: string }[]) {
    await IFoodService.syncCatalog(products);
  },

  // Obter pedidos
  async getOrders(params?: { limit?: number }) {
    set({ ordersLoading: true });
    try {
      const orders = await IFoodService.getOrders(params);
      set({ orders, ordersLoading: false });
    } catch (error) {
      set({ ordersLoading: false });
      throw error;
    }
  },

  // Obter pedido específico
  async getOrderById(orderId: string) {
    const order = await IFoodService.getOrderById(orderId);
    set({ currentOrder: order });
  },

  // Confirmar pedido
  async confirmOrder(orderId: string, estimatedTime?: number) {
    await IFoodService.confirmOrder(orderId, estimatedTime);
    // Atualizar pedido na lista
    const orders = get().orders;
    const updatedOrders = orders.map((order: IFoodOrder) => 
      order.id === orderId 
        ? { ...order, status: 'CONFIRMED' as const }
        : order
    );
    set({ orders: updatedOrders });
  },

  // Cancelar pedido
  async cancelOrder(orderId: string, reason: string) {
    await IFoodService.cancelOrder(orderId, reason);
    // Atualizar pedido na lista
    const orders = get().orders;
    const updatedOrders = orders.map((order: IFoodOrder) => 
      order.id === orderId 
        ? { ...order, status: 'CANCELLED' as const }
        : order
    );
    set({ orders: updatedOrders });
  },

  // Despachar pedido
  async dispatchOrder(orderId: string) {
    await IFoodService.dispatchOrder(orderId);
    // Atualizar pedido na lista
    const orders = get().orders;
    const updatedOrders = orders.map((order: IFoodOrder) => 
      order.id === orderId 
        ? { ...order, status: 'DISPATCHED' as const }
        : order
    );
    set({ orders: updatedOrders });
  },

  // Obter resumo de vendas
  async getSalesSummary(params?: { groupBy?: 'day' | 'week' | 'month'; startDate?: string; endDate?: string }) {
    const summary = await IFoodService.getSalesSummary(params);
    set({ salesSummary: summary });
  },

  // Obter produtos mais vendidos
  async getTopProducts(params?: { limit?: number }) {
    const products = await IFoodService.getTopProducts(params);
    set({ topProducts: products });
  },

  // Testar webhook
  async testWebhook() {
    await IFoodService.testWebhook();
  },

  // Obter status da integração
  async getIntegrationStatus() {
    try {
      const status = await IFoodService.getIntegrationStatus();
      set({ 
        isIntegrationActive: status.isActive,
        integrationStatus: status.isActive ? 'connected' : 'idle'
      });
    } catch {
      set({ integrationStatus: 'error' });
      throw new Error('Erro ao obter status da integração');
    }
  },
});

export const useIFoodStore = create<IFoodState>(ifoodStoreCreator);
