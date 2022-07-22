import { User } from "../db/User"

export const checkIfAdmin = async (req, res, next) => {
    if(!req.session.user) return res.sendStatus(401);
    const user = await User.findById(req.session.user);
    if (!user) return res.sendStatus(401);
    if (user.isAdmin) return next();

    res.send("Must be an admin to access this feature.");
}