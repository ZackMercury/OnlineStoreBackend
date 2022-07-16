import { User } from "../db/User"

export const checkIfAdmin = async (req, res, next) => {
    const user = await User.findById(req.session.user);
    if (!user) return res.sendStatus(401);
    if (user.isAdmin) next();

    res.send("Must be an admin to access this feature.");
}