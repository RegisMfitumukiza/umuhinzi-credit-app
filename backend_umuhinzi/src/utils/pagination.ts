export type PaginationResult = {
    page: number,
    limit: number,
    skip: number
}

export const getPagination = (limitQuery: unknown, pageQuery: unknown) : PaginationResult => {

    const page = Math.max(parseInt(String(pageQuery)) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(limitQuery)) || 10, 1), 50);

    const skip = (page -1) * limit;

    return {
        page,
        limit,
        skip
    }
}


