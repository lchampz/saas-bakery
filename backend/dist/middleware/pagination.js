export const paginationMiddleware = (options = {
    defaultLimit: 10,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc'
}) => {
    return (req, res, next) => {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(options.maxLimit, Math.max(1, parseInt(req.query.limit) || options.defaultLimit));
        const sortBy = req.query.sortBy || options.defaultSortBy;
        const sortOrder = req.query.sortOrder || options.defaultSortOrder;
        req.pagination = {
            page,
            limit,
            sortBy,
            sortOrder,
            skip: (page - 1) * limit,
        };
        next();
    };
};
export const createPaginationResponse = (data, total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
        },
    };
};
