import server from '../dist/server/server.js';

export const config = {
  runtime: 'edge',
};

export default function fetch(request, event) {
  return server.fetch(request, process.env, event);
}
