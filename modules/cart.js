import express from "express";
import { loginCheck, roleCheck } from "../utils.js";
import constants from "../constants.js";
import dbClient from "../dbClient.js";

const cartRouter = express.Router();

cartRouter.post(
    "/addToCart",
    loginCheck,
    roleCheck(constants.roles.CUSTOMER),
    async (req, res) => {
        try {
            const requiredFields = ["productId", "quantity"];
            const missing = requiredFields.filter((field) => !req.body[field]);

            if (missing.length) {
                return res
                    .status(400)
                    .send(`Missing fields: ${missing.join(", ")}`);
            }

            const cart = await dbClient.readData(constants.collections.CARTS, {
                username: req.user.username,
                productId: req.body.productId,
            });

            if (cart?.length) {
                await dbClient.updateData(
                    constants.collections.CARTS,
                    {
                        username: req.user.username,
                        productId: req.body.productId,
                    },
                    { $inc: { quantity: req.body.quantity } }
                );
            } else if (req.body.quantity > 0) {
                await dbClient.addData(constants.collections.CARTS, {
                    username: req.user.username,
                    productId: req.body.productId,
                    quantity: req.body.quantity,
                });
            } else {
                return res.status(400).send("Quantity must be greater than 0");
            }

            res.status(201).send("Product added to cart successfully");
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
    }
);

cartRouter.post(
    "/removeFromCart",
    loginCheck,
    roleCheck(constants.roles.CUSTOMER),
    async (req, res) => {
        try {
            if (!req.body.productId) {
                return res.status(400).send("Product ID is required");
            }
            await dbClient.deleteData(constants.collections.CARTS, {
                username: req.user.username,
                productId: req.body.productId,
            });
            res.status(200).send("Product removed from cart successfully");
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
    }
);

cartRouter.get(
    "/totalPrice",
    loginCheck,
    roleCheck(constants.roles.CUSTOMER),
    async (req, res) => {
        try {
            const connection = await dbClient.getConnection();
            const db = connection.db(constants.DB_NAME);
            let total = await db
                .collection(constants.collections.CARTS)
                .aggregate([
                    {
                        $match:
                            {
                                username: req.user.username,
                            },
                    },
                    {
                        $addFields: {
                            productObjId: {
                                $toObjectId: "$productId",
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "products",
                            localField: "productObjId",
                            foreignField: "_id",
                            as: "product",
                        },
                    },
                    {
                        $unwind: {
                            path: "$product",
                            includeArrayIndex: "tagIndex",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $project: {
                            quantity: 1,
                            price: "$product.price",
                            total: {
                                $multiply: ["$quantity", "$product.price"],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalCartPrice: {
                                $sum: "$total",
                            },
                        },
                    },
                ])
                .toArray();

            res.status(200).json({ total: total[0]?.totalCartPrice || 0 });
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
    }
);

export default cartRouter;
