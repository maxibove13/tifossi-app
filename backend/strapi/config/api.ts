export default ({ env: _env }: { env: any }) => ({
  rest: {
    defaultLimit: 25,
    maxLimit: 100,
    withCount: true,
  },
  responses: {
    privateAttributes: ['_v', 'id', 'created_at'],
  },
  pagination: {
    pageSize: 25,
    maxPageSize: 100,
  },
});
