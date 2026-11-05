export class HttpError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
export const errorHandler = (error, _req, res, _next) => {
    const status = error instanceof HttpError ? error.status : 500;
    res.status(status).json({ error: status === 500 ? "Internal Server Error" : error.message });
};
