import client from './client';

export const getStories = () => client.get('/stories');
export const reactToStory = (storyId, type) => client.post('/reactions', { entityType: 'story', entityId: storyId, type });
export const commentOnStory = (storyId, content) => client.post('/comments', { entityType: 'story', entityId: storyId, content });
