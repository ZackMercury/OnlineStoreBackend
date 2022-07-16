import express, { Express, json } from 'express';
import session from "express-session";
import { createHash } from 'crypto';
import mongoose from 'mongoose';
import { SignUpRequest, signUpSchema } from './requests/SignUpRequest';
import { LoginRequest, loginSchema } from './requests/LoginRequest';
import { User } from './db/User';
import { NewItemRequest, newItemSchema } from './requests/NewItemRequest';
import { Item } from './db/Item';

const PORT: number = 9000;
const DATABASE_LINK: string = "mongodb://localhost:27017/onlineStore";

// Server init


const server:Express = express();
server.use(json());
server.use(session({
    secret: "Top Secret Number 1 You'll Never Know Bech",
    cookie: {
        path: "/",
        httpOnly: true,
        maxAge: (4 * 7 * 24 * 60 * 60 * 1000) //ms, 4 weeks
    }
}));
// Database init
mongoose.connect(DATABASE_LINK);

// Request handlers
server.get("/*", (req, res) => {
    res.sendStatus(404);
    res.send("404 Not found");
});

server.post("/signUp", async (req, res) => {
    // Validation
    const validationRes = signUpSchema.validate(req.body);
    if (validationRes.error) {
        res.send(validationRes.error.message);
        console.error(validationRes.error.message);
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

    // TODO Proper response object
    res.send("Registration success");
});



server.post("/login", async (req, res) => {
    // Validation
    const validationRes = loginSchema.validate(req.body);
    if (validationRes.error) {
        console.error(validationRes.error.message);
        res.send(`${validationRes.error.name}: ${validationRes.error.message}`)
        return
    }

    // Logging in

    const data: LoginRequest = validationRes.value;
    const hashedPassword = createHash("sha256").update(data.password).digest("base64");

    const user = await User.findOne({
        login: data.login,
        passwordHashed: hashedPassword
    });

    if (!user) return res.redirect("/register");

    // Setting up session data
    //TODO Setting up session data

    res.redirect("/");
});

server.post("/additem", async (req, res) => {
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
});

server.patch("/addfavorite", (req, res) => {
    // TODO Validate and add favorite
});

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});