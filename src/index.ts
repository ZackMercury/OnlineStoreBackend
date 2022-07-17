import express, { Express, json } from 'express';
import session from "express-session";
import { createHash } from 'crypto';
import mongoose from 'mongoose';
import { SignUpRequest, signUpSchema } from './requests/SignUpRequest';
import { SignInRequest, signInSchema } from './requests/SignInRequest';
import { User } from './db/User';
import { NewItemRequest, newItemSchema } from './requests/NewItemRequest';
import { Item } from './db/Item';
import { AddFavoriteRequest, addFavoriteSchema } from './requests/AddFavoriteRequest';
import { checkIfAdmin } from './middlewares/checkIfAdmin';
import { checkIfSignedIn } from './middlewares/checkIfSignedIn';
import { GetItemsRequest, getItemsSchema } from './requests/GetItemsRequest';

const PORT: number = 9000;
const DATABASE_LINK: string = "mongodb://localhost:27017/onlineStore";

//#region Server init

const server:Express = express();
server.use(json());
server.use(session({
    secret: "Top Secret Number 1 You'll Never Know Bech",
    resave: true,
    saveUninitialized: true,
    cookie: {
        path: "/",
        httpOnly: true,
        maxAge: (4 * 7 * 24 * 60 * 60 * 1000) //ms, 4 weeks
    }
}));

//#endregion

// Database init
mongoose.connect(DATABASE_LINK);
// Setup application settings as a global mongodb object and hit Save on any modifications

// Request handlers
server.get("/*", (req, res) => {
    res.sendStatus(404);
});

//#region Visitor features

server.post("/signup", async (req, res) => {
    // Validation
    const validationRes = signUpSchema.validate(req.body);
    if (validationRes.error) {
        res.statusCode = 400;
        res.send(`The request is invalid: ${validationRes.error.message}`);
        return;
    }

    const data: SignUpRequest = validationRes.value;

    // Recaptcha verification
    // TODO Recaptcha verification

    // Checking the DB for login / email overlap
    const overlap = User.where().or([
        { email: data.email }, 
        { login: data.login },
        { phone: data.phone }
    ]);
    if((await overlap).length)
        return res.send("User with such phone, email or login already exists.");
    
    const documentCount = await User.countDocuments();
    // Adding the new user to the users collection
    const passwordHashed = createHash("sha256").update(data.password).digest("base64");
    const newUser = new User({
        email: data.email,
        login: data.login,
        phone: data.phone,
        passwordHashed: passwordHashed,
        address: data.address,
        firstname: data.firstname,
        lastname: data.lastname,
        favorites: [],
        isAdmin: documentCount < 1 // The first user to register will become an admin
        // An admin will also have the rights to give admin role to other users
    });
    await newUser.save();

    res.sendStatus(200);
});

server.post("/signin", async (req, res) => {
    // Validation
    const validationRes = signInSchema.validate(req.body);
    if (validationRes.error) {
        console.error(validationRes.error.message);
        res.send(`${validationRes.error.name}: ${validationRes.error.message}`)
        return
    }

    // Logging in

    const data: SignInRequest = validationRes.value;
    const hashedPassword = createHash("sha256").update(data.password).digest("base64");

    const user = await User.findOne({
        login: data.login,
        passwordHashed: hashedPassword
    });

    if (!user) return res.redirect("/register");

    // Saving the user id within session
    req.session.user = user.id;

    res.redirect("/");
});

server.get("/getitems", async (req, res) => {
    // Validation
    const validationRes = getItemsSchema.validate(req.body);
    if (validationRes.error) return res.send(`The request is invalid: ${validationRes.error.message}`);
    const data: GetItemsRequest = validationRes.value;
    // TODO get rid of magical values
    const sortingFields = ["id", "name", "price", "description"];
    if (!sortingFields.includes(data.sortBy)) return res.send(`Field ${data.sortBy} not found.`);
    
    // Sorting, filtering
    const items = await Item.find()
    .sort({[data.sortBy]: (data.sort == "asc" ? 1: -1)}) // Sorting
    .skip(data.perPage * data.page).limit(data.perPage) // Pagination
    // TODO filtering

    return res.json(items);
});

server.get("/item", async (req, res) => {
    // TODO get item details
});

//#endregion

//#region User features

server.patch("/addfavorite", checkIfSignedIn, async (req, res) => {
    const validationRes = addFavoriteSchema.validate(req.body);
    if (validationRes.error) return res.send(`${validationRes.error.name}: ${validationRes.error.message}`);
    const data: AddFavoriteRequest = validationRes.value;

    // Verify whether the provided ObjectId is valid
    const item = await Item.findById(data.itemID);
    if (!item) return res.sendStatus(400);

    // Add favorite item id to the array
    const user = await User.findById(req.session.user);
    if (!user) return res.sendStatus(401);

    if(!user.favorites.includes(item.id)) user.favorites.push(item.id);
    await user.save();

    res.sendStatus(200);
});

server.patch("/removefavorite", checkIfSignedIn, async (req, res) => {
    // TODO remove favorite
})

//#endregion

//#region Admin features
server.post("/additem", checkIfSignedIn, checkIfAdmin, async (req, res) => {
    // Validation
    const validationRes = newItemSchema.validate(req.body);
    if (validationRes.error) return res.send(`${validationRes.error.name}: ${validationRes.error.message}`)
    const data: NewItemRequest = validationRes.value;

    const newItem = new Item({
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        technicalDetails: data.technicalDetails
    });

    await newItem.save();

    res.sendStatus(200);
});

server.delete("/removeitem", checkIfSignedIn, checkIfAdmin, async (req, res) => {
    // TODO remove item
});

server.patch("/edititem", checkIfSignedIn, checkIfAdmin, async (req, res) => {
    // TODO edit item
});

server.get("/getusers", checkIfSignedIn, checkIfAdmin, async (req, res) => {
   // TODO get users
});

//#endregion

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});