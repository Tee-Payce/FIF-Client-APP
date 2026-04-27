import client from './client';

export const getComments = (entityType: string, entityId: string) => 
  client.get(`/comments?entityType=${entityType}&entityId=${entityId}`);

export const addComment = (entityType: string, entityId: string, content: string) => 
  client.post('/comments', { entityType, entityId, content });

export const deleteComment = (id: string) => 
  client.delete(`/comments/${id}`);

export const reactToComment = (id: string, type: 'like' | 'heart' | 'prayer') => 
  client.post(`/comments/${id}/react`, { type });

export const getBookReviews = (bookId: string) => 
  client.get(`/books/${bookId}/reviews`);

export const addBookReview = (bookId: string, rating: number, comment?: string) => 
  client.post(`/books/${bookId}/reviews`, { rating, comment });
