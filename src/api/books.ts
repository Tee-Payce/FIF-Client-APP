import client from './client';

export const getBooks = () => client.get('/books');
export const getSecureBookUrl = (id) => client.get(`/secure/book/${id}`);
