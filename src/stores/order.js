import { defineStore } from 'pinia';

export const useOrderStore = defineStore('order', {
  state: () => ({
    currentOrder: null
  }),
  getters: {
    order: (state) => state.currentOrder
  },
  actions: {
    setOrder(orderData) {
      this.currentOrder = orderData;
    },
    clearOrder() {
      this.currentOrder = null;
    },
    updateOrderStatus(status) {
      if (this.currentOrder) {
        this.currentOrder.status = status;
      }
    }
  }
});