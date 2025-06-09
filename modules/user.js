import express from "express";
import dbClient from "../dbClient.js";
import constants from "../constants.js";
import jwt from "jsonwebtoken";

const userRouter = express.Router();

userRouter.post("/register", async (req, res) => {
    try {
        if (
            !req.body.username ||
            !req.body.password ||
            !req.body.email ||
            !req.body.role
        ) {
            return res
                .status(400)
                .send(
                    "Require parameters missing: username, password, email, role"
                );
        }

        if (!Object.values(constants.roles).includes(req.body.role)) {
            return res.status(400).send("Invalid role");
        }

        const user = await dbClient.readData(constants.collections.USERS, {
            username: req.body.username,
        });

        if (user?.length) {
            return res.status(400).send("User already exists");
        }

        await dbClient.addData(constants.collections.USERS, {
            username: req.body.username,
            password: req.body.password,
            role: req.body.role,
            email: req.body.email,
        });

        res.status(201).send("User registered successfully");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

userRouter.post("/login", async (req, res) => {
    try {
        if (!req.body.username || !req.body.password) {
            return res.status(400).send("Username and password are required");
        }

        const users = await dbClient.readData(constants.collections.USERS, {
            username: req.body.username,
            password: req.body.password,
        });

        if (users?.length === 0) {
            return res.status(401).send("Invalid username or password");
        }

        const token = jwt.sign(
            { username: req.body.username, role: users[0].role, email: users[0].email },
            constants.JWT_SECRET
        );

        res.status(200).json({ token });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

export default userRouter;
