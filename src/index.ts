import express, { Express, json } from 'express';
import { Hash, createHash, getHashes } from 'crypto';
import mongoose from 'mongoose';
import { RegisterRequest, registerSchema } from './requests/RegisterRequest';
import { LoginRequest, loginSchema } from './requests/LoginRequest';
import { User } from './db/User';

const PORT: number = 9000;
const DATABASE_ADDR: string = "mongodb://localhost:27017/onlineStore";

const server:Express = express();
server.use(json());

mongoose.connect(DATABASE_ADDR);

server.get("/*", (req, res) => {
    res.sendStatus(404);
    res.send("404 Not found");
});

server.post("/register", async (req, res) => {
    // Validation
    const validationRes = registerSchema.validate(req.body);
    if (validationRes.error) {
        res.send(validationRes.error.message);
        console.error(validationRes.error.message);
        return;
    }
    
    const data: RegisterRequest = validationRes.value;
    const passwordHashed = createHash("sha256").update(data.password).digest("base64");

    // Checking the DB for login / email overlap
    const overlap = User.where().or([{
        email: data.email
    }, {
        login: data.login
    }]);
    if((await overlap).length) {
        res.send("User with such email or login already exists.");
        return;
    }

    // Adding the new user to the users collection
    const newUser = new User({
        email: data.email,
        login: data.login,
        passwordHashed: passwordHashed
    });

    newUser.save();
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
    
});

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});