import api from './index.js';

export function getProducts(category) {
  return api.get('/shop/products', { params: { category } });
}

export function getProduct(id) {
  return api.get(`/shop/products/${id}`);
}

export function getRelatedProducts(productId) {
  return api.get(`/shop/products/${productId}/related`);
}

export function getCategories() {
  return api.get('/shop/categories');
}

export function checkout(orderData) {
  return api.post('/shop/checkout', orderData);
}

export function getOrder(orderNo) {
  return api.get(`/shop/orders/${orderNo}`);
}

export function getUserOrders(page = 1, limit = 10, status = 'all') {
  return api.get('/shop/orders', { params: { page, limit, status } });
}

export function getAllOrders(page = 1, limit = 10, status = 'all') {
  return api.get('/shop/orders/all', { params: { page, limit, status } });
}

export function confirmPayment(orderNo) {
  return api.post(`/shop/orders/${orderNo}/confirm-payment`);
}

export function confirmOrder(orderNo) {
  return api.post(`/shop/orders/${orderNo}/confirm`);
}

export function deleteOrder(orderNo) {
  return api.delete(`/shop/orders/${orderNo}`);
}
