import express, { Express, json } from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import { Hash, createHash, getHashes } from 'crypto';
import Joi from 'joi';

const PORT: number = 9000;

const server:Express = express();
server.use(json());

server.get("/*", (req, res) => {
    res.sendStatus(404);
    res.send("Bad request");
});

server.post("/register", (req, res) => {
    const schema = Joi.object().keys({
        email: Joi.string().trim().email().required(),
        login: Joi.string().min(2).max(30).trim().required(),
        password: Joi.string().min(5).required()
    });

    console.log(schema.validate(req.body));
    console.log(req.body);
    const login: string = req.body.login;
    const password: string = req.body.password;
    const passwordHashed = createHash("sha256").update(password).digest("base64");

    res.send("Hello");
});

server.post("/login", (req, res) => {
    const schema = Joi.object().keys({
        login: Joi.string().trim().min(2).max(30).required(),
        password: Joi.string().min(5).required()
    })
});

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});