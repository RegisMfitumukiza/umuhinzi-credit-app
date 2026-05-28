export type PaginationResult = {
    page: number,
    limit: number,
    skip: number
}

export const getPagination = (limitQuery: unknown, pageQuery: unknown) : PaginationResult => {
  const page = Math.max(parseInt(String(pageQuery)) || 1, 1);
  let limit = parseInt(String(limitQuery)) || 10;
  limit = Math.min(Math.max(limit, 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
