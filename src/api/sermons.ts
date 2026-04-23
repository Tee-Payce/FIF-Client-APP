import client from './client';

export const getSermons = () => client.get('/sermons');
