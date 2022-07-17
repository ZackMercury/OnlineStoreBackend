export const checkIfSignedIn = async (req, res, next) => {
    if(req.session.user) next();

    res.sendStatus(401);
}