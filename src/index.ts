import express, { Express, json, urlencoded } from 'express';
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
import { RemoveFavoriteRequest, removeFavoriteSchema } from './requests/RemoveFavoriteRequest';
import { RemoveItemRequest, removeItemSchema } from './requests/RemoveItemRequest';
import { EditItemRequest, editItemSchema } from './requests/EditItemRequest';
import { GetItemRequest, getItemSchema } from './requests/GetItemRequest';
import { GiveAdminRequest, giveAdminSchema } from './requests/GiveAdminRequest';
import { Settings } from './db/Settings';
import { populateCategoryTree } from './utils/populateCategoryTree';
import cors from 'cors';
import { GetImageRequest, getImageSchema } from './requests/GetImageRequest';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// App constants
const PORT: number = 9000;
const DATABASE_LINK: string = "mongodb://localhost:27017/onlineStore";
const WHITELIST = ["http://localhost", "http://192.168.88.117", "http://localhost:9000", undefined];
// Items constants
const AVAILABLE_SORTING_FIELDS = ["id", "name", "price"];

// TODO refactor into classes

//#region Server init

const server:Express = express();
server.use(cors({
    credentials: true,
    origin: function (origin, callback) {
        if (WHITELIST.indexOf(origin) > -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}));
server.use(urlencoded({ extended: false }));
server.use(json());
server.use(session({
    secret: "Top Secret Number 1 You'll Never Know Bech",
    resave: true,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: (4 * 7 * 24 * 60 * 60 * 1000) //ms, 4 weeks
    }
}));
const uploadToImages = multer({ dest: path.resolve(__dirname, "images") });

//#endregion

// Database init
mongoose.connect(DATABASE_LINK);

// Setup application settings as a global mongodb object
let settings: any;
Settings.findOne(undefined, async (err, doc) => {
    if (!doc) doc = new Settings({ categoryTree: "{}" });
    settings = doc;
    await settings.save();
});

// Request handlers
server.get("/", (req, res) => {
    res.sendStatus(404);
});

//#region Visitor features

server.post("/signup", async (req, res) => {
    // Validation
    const validationRes = signUpSchema.validate(req.body);
    if (validationRes.error) return res.status(400).send(`Invalid request: ${validationRes.error.message}`);

    const data: SignUpRequest = validationRes.value;

    // Checking the DB for login / email overlap
    const overlap = User.where().or([
        { email: data.email }, 
        { login: data.login },
        { phone: data.phone }
    ]);
    if((await overlap).length)
        return res.status(400).send("User with such phone, email or login already exists.");
    
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
    if (validationRes.error) return res.status(400).send(`Invalid request: ${validationRes.error.message}`);
    const data: SignInRequest = validationRes.value;

    // Logging in
    const hashedPassword = createHash("sha256").update(data.password).digest("base64");

    const user = await User.findOne({
        login: data.login,
        passwordHashed: hashedPassword
    });

    if (!user) return res.sendStatus(400);

    // Saving the user id within session
    //@ts-ignore
    req.session.user = user.id;

    res.sendStatus(200);
});

server.post("/getitems", async (req, res) => {
    // Validation
    const validationRes = getItemsSchema.validate(req.body);
    if (validationRes.error) return res.status(400).send(`Invalid request: ${validationRes.error.message}`);
    const data: GetItemsRequest = validationRes.value;
    if (!AVAILABLE_SORTING_FIELDS.includes(data.sortBy!)) return res.send(`Field ${data.sortBy} not found or not allowed to sort by.`);

    if (data.items) {
        const itemQuery = Item.find().where().or(data.items.map(itemID => { return { _id: itemID }}));
        const items = await itemQuery;
        return res.json({items, pages: 1});
    }
    // Sorting, filtering
    let itemsQuery;
    if (data.filter && data.filter.searchQuery) {
        itemsQuery = Item.find({
            $text: {
                $search: data.filter.searchQuery
            }
        }, { score: {
            $meta: "textScore"
        }}).sort({ score: { $meta: "textScore"}})
    }
    else
        itemsQuery = Item.find();
    // Filtering
    if (data.filter) {
        const filter = data.filter;
        if (filter.priceMin || filter.priceMax)
        {
            itemsQuery = itemsQuery.where("price");
            if (filter.priceMin)
                itemsQuery = itemsQuery.gte(filter.priceMin);
            if (filter.priceMax)
                itemsQuery = itemsQuery.lte(filter.priceMax);
        }
        if (filter.category) {
            itemsQuery.where({
                category: { $all : filter.category }
            })
        }
    }

    if (data.sortBy == "id")
        data.sortBy = "_id";
    // Sorting
    if (data.sort == "asc")
        itemsQuery = itemsQuery.sort({[data.sortBy!]: 1}); 
    else if (data.sort == "desc")
        itemsQuery = itemsQuery.sort({[data.sortBy!]: -1});

    const beforePagination = itemsQuery.clone();
    itemsQuery = itemsQuery.skip(data.perPage * data.page).limit(data.perPage) // Pagination

    const items: any = await itemsQuery;
    const totalItems = await beforePagination;

    return res.json({items, pages: Math.ceil(totalItems.length / data.perPage)});
});

server.get("/item/:itemID", async (req, res) => {
    // Validation
    const validationRes = getItemSchema.validate(req.params);
    if (validationRes.error) return res.status(400).send(`Invalid request: ${validationRes.error.message}`);
    const data: GetItemRequest = validationRes.value;

    const item = await Item.findById(data.itemID);
    if (!item) return res.status(400).send(`Item ${data.itemID} not found`);

    return res.json(item);
});

server.get("/categoryTree", async (req, res) => {
    res.set('Cache-Control', 'no-store');
    return res.json(JSON.parse( settings.categoryTree ));
});

server.get("/image/:itemID", async (req, res) => {
    const validationRes = getImageSchema.validate(req.params);
    if(validationRes.error) return res.status(400).send(`Invalid request: ${validationRes.error.message}`);
    const data: GetImageRequest = validationRes.value;
    const fileLocation1 = path.resolve(__dirname, "images", data.itemID + ".jpg");
    const fileLocation2 = path.resolve(__dirname, "images", data.itemID + ".png");
    if(fs.existsSync(fileLocation1))
        res.contentType("image/jpeg").sendFile(fileLocation1);
    else if (fs.existsSync(fileLocation2))
        res.contentType("image/png").sendFile(fileLocation2);
    else   
        res.sendStatus(404);
});

//#endregion

//#region User features

server.patch("/addfavorite", checkIfSignedIn, async (req, res) => {
    const validationRes = addFavoriteSchema.validate(req.body);
    if (validationRes.error) return res.status(400).send(`Invalid request: ${validationRes.error.message}`);
    const data: AddFavoriteRequest = validationRes.value;

    // Verify whether the provided ObjectId is valid
    const item = await Item.findById(data.itemID);
    if (!item) return res.status(400).send(`Item ${data.itemID} does not exist`);

    // Add favorite item id to the array
    //@ts-ignore
    const user = await User.findById(req.session.user);
    if (!user) return res.status(500).send(`Session contains an unknown user.`);

    if(!user.favorites.includes(item.id)) user.favorites.push(item.id);
    await user.save();

    res.sendStatus(200);
});

server.patch("/removefavorite", checkIfSignedIn, async (req, res) => {
    // Validation
    const validationRes = removeFavoriteSchema.validate(req.body);
    if (validationRes.error) return res.status(400).send(`Invalid request: ${validationRes.error.message}`)
    const data: RemoveFavoriteRequest = validationRes.value;
    
    // Checking if the item exists
    const item = await Item.findById(data.itemID);
    if (!item) return res.status(400).send(`Item ${data.itemID} does not exist.`);

    // Removing the item from the current session user favorite list
    //@ts-ignore
    const user = await User.findById(req.session.user);
    if (!user) return res.status(500).send(`Session contains an unknown user.`);
    const favs = user.favorites;
    if (favs.includes(item.id)) {
        favs.splice(favs.indexOf(item.id), 1);
    }
    user.save();

    return res.sendStatus(200);
})

server.get("/logout", checkIfSignedIn, (req, res) => {
    //@ts-ignore
    req.session.user = undefined;
    res.sendStatus(200);
});

server.get("/user", checkIfSignedIn, async (req, res) => {
    //@ts-ignore
    const userID = req.session.user;
    const user = await User.findById(userID);
    user!.passwordHashed = undefined;
    return res.send(user);
});

//#endregion

//#region Admin features

// Had to manually encode and decode JSON for this one because of stupid FormData
server.post("/additem", checkIfSignedIn, checkIfAdmin, uploadToImages.single("picture"), async (req, res) => {
    req.body.category = JSON.parse(req.body.category);
    req.body.technicalDetails = JSON.parse(req.body.technicalDetails);
    // Validation
    const validationRes = newItemSchema.validate(req.body);
    if (validationRes.error) return res.status(400).send(`Invalid request: ${validationRes.error.message}`)
    const data: NewItemRequest = validationRes.value;

    const newItem = new Item({
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        technicalDetails: data.technicalDetails
    });

    await newItem.save();

    fs.renameSync(req.file!.path, req.file?.destination + "\\" + newItem.id + "." + req.file!.originalname.split(".").pop());
    // Category tree update
    const tree = JSON.parse(settings.categoryTree);
    populateCategoryTree(tree, data.category);
    settings.categoryTree = JSON.stringify(tree);
    settings.save();

    res.sendStatus(200);
});

server.delete("/removeitem/:itemID", checkIfSignedIn, checkIfAdmin, async (req, res) => {
    // Validation
    const validationRes = removeItemSchema.validate(req.params);
    if (validationRes.error) return res.status(400).send(`Invalid request: ${validationRes.error.message}`)
    const data: RemoveItemRequest = validationRes.value;

    // Remove item
    const item = await Item.findById(data.itemID);
    if (item) item.delete();

    res.sendStatus(200);
});

server.patch("/edititem", checkIfSignedIn, checkIfAdmin, uploadToImages.single("picture"), async (req, res) => {
    req.body.category = JSON.parse(req.body.category);
    req.body.technicalDetails = JSON.parse(req.body.technicalDetails);
    // Validation
    const validationRes = editItemSchema.validate(req.body);
    if (validationRes.error) return res.status(400).send(`Invalid request: ${validationRes.error.message}`)
    const data: EditItemRequest = validationRes.value;
    
    // Check if the item exists otherwise throw error
    const item = await Item.findById(data.itemID);
    if (!item) return res.status(400).send(`Item ${data.itemID} does not exist.`);

    // Update the item
    item.name = data.name;
    item.category = data.category;
    item.description = data.description;
    item.price = data.price;
    item.technicalDetails = data.technicalDetails;
    item.save();

    const jpegFile = req.file!.destination + "\\" + item.id + ".jpg";
    const pngFile = req.file!.destination + "\\" + item.id + ".png";
    if(fs.existsSync(jpegFile))
        fs.rmSync(jpegFile);
    if(fs.existsSync(pngFile))
        fs.rmSync(pngFile);
    fs.renameSync(req.file!.path, req.file?.destination + "\\" + item.id + "." + req.file!.originalname.split(".").pop());
    // Category tree update
    const tree = JSON.parse(settings.categoryTree);
    populateCategoryTree(tree, data.category);
    settings.categoryTree = JSON.stringify(tree);
    settings.save();

    res.sendStatus(200);
});

server.get("/getusers", checkIfSignedIn, checkIfAdmin, async (req, res) => {
    // No need to validate anything, since no client input expected
    const users = await User.find();
    users.forEach(user => user.passwordHashed = undefined);
    return res.json(users);
});

server.patch("/giveadmin", checkIfSignedIn, checkIfAdmin, async (req, res) => {
    // Validation
    const validationRes = giveAdminSchema.validate(req.body);
    if (validationRes.error) return res.status(400).send(`Invalid request: ${validationRes.error.message}`)
    const data: GiveAdminRequest = validationRes.value;

    const user = await User.findById(data.userID);
    if (!user) return res.status(400).send(`User ${data.userID} not found.`);

    user.isAdmin = true;
    user.save();

    return res.sendStatus(200);
})

server.patch("/takeadmin", checkIfSignedIn, checkIfAdmin, async (req, res) => {
    // Validation
    const validationRes = giveAdminSchema.validate(req.body);
    if (validationRes.error) return res.status(400).send(`Invalid request: ${validationRes.error.message}`)
    const data: GiveAdminRequest = validationRes.value;

    const user = await User.findById(data.userID);
    if (!user) return res.status(400).send(`User ${data.userID} not found.`);

    user.isAdmin = false;
    user.save();

    return res.sendStatus(200);
})

//#endregion

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});