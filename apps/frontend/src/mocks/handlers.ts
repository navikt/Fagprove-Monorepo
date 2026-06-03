import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/hello', () => {
    return HttpResponse.json({ message: 'Hello from Ktor backend!' });
  }),

  http.get('/api/cities', () => {
    return HttpResponse.json([
      { id: 1, name: 'Oslo', population: 709037 },
      { id: 2, name: 'Bergen', population: 289330 },
      { id: 3, name: 'Trondheim', population: 212660 },
    ]);
  }),

  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Ola Nordmann', age: 30 },
      { id: 2, name: 'Kari Nordmann', age: 25 },
    ]);
  }),
];
