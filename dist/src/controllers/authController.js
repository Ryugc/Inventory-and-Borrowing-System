import { authService } from "../services/authService.js";
export async function login(req, res, next) {
    try {
        res.status(200).json(await authService.login(req.body));
    }
    catch (error) {
        next(error);
    }
}
