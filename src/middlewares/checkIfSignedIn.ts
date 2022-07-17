import { User } from "../db/User";

export const checkIfSignedIn = async (req, res, next) => {
    if(req.session.user) {
        const user = await User.findById(req.session.user);
        if (!user) {
            req.session.user = undefined;
            return res.sendStatus(401);
        }
        next();
    }
    res.sendStatus(401);
}