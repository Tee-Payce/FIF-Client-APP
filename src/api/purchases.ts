import client from './client';

export const purchaseBook = (bookId) => client.post(`/purchase/book/${bookId}`);
export const getMyPurchases = () => client.get('/purchase/my');
