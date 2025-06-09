import express from "express";
import { loginCheck, roleCheck } from "../utils.js";
import constants from "../constants.js";
import dbClient from "../dbClient.js";

const productRouter = express.Router();

productRouter.post(
    "/addProduct",
    loginCheck,
    roleCheck(constants.roles.ADMIN),
    async (req, res) => {
        try {
            const requiredFields = [
                "title",
                "price",
                "category",
                "description",
                "stock",
                "image",
            ];
            const missing = requiredFields.filter((field) => !req.body[field]);

            if (missing.length) {
                return res
                    .status(400)
                    .send(`Missing fields: ${missing.join(", ")}`);
            }

            let existingProduct = await dbClient.readData(
                constants.collections.PRODUCTS,
                { title: req.body.title }
            );

            if (existingProduct?.length) {
                return res.status(400).send("Product already exists");
            }

            await dbClient.addData(constants.collections.PRODUCTS, {
                title: req.body.title,
                price: req.body.price,
                category: req.body.category,
                description: req.body.description,
                stock: req.body.stock,
                image: req.body.image,
            });

            res.status(201).send("Product added successfully");
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
    }
);

productRouter.post(
    "/updateProduct",
    loginCheck,
    roleCheck(constants.roles.ADMIN),
    async (req, res) => {
        try {
            if (!req.body.title) {
                return res.status(400).send("Title is required");
            }

            await dbClient.updateData(
                constants.collections.PRODUCTS,
                { title: req.body.title },
                { $set: req.body }
            );

            res.status(200).send("Product updated successfully");
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
    }
);

productRouter.post(
    "/deleteProduct",
    loginCheck,
    roleCheck(constants.roles.ADMIN),
    async (req, res) => {
        try {
            if (!req.body.title) {
                return res.status(400).send("Title is required");
            }

            await dbClient.deleteData(constants.collections.PRODUCTS, {
                title: req.body.title,
            });

            res.status(200).send("Product deleted successfully");
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
    }
);

productRouter.get("/getProducts", loginCheck, async (req, res) => {
    try {
        let { stock, price, ...restFilters } = req.query;
        if (stock) {
            restFilters = {
                ...restFilters,
                stock: {
                    $gte: parseInt(stock),
                },
            };
        }

        if (price) {
            price = JSON.parse(price);
            restFilters.price = {};
            if (price.min) {
                restFilters.price.$gte = price.min;
            }
            if (price.max) {
                restFilters.price.$lte = price.max;
            }
            console.log(restFilters);
        }

        let products = await dbClient.readData(
            constants.collections.PRODUCTS,
            restFilters
        );
        res.status(200).json(products);
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

productRouter.post(
    "/rateProduct",
    loginCheck,
    roleCheck(constants.roles.CUSTOMER),
    async (req, res) => {
        try {
            const requiredFields = ["title", "rating"];
            const missing = requiredFields.filter((field) => !req.body[field]);

            if (missing.length) {
                return res
                    .status(400)
                    .send(`Missing fields: ${missing.join(", ")}`);
            }

            if (req.body.rating < 1 || req.body.rating > 5) {
                return res.status(400).send("Rating must be between 1 and 5");
            }

            const product = await dbClient.readData(
                constants.collections.PRODUCTS,
                { title: req.body.title }
            );

            if (!product?.length) {
                return res.status(404).send("Product not found");
            }

            const currentRating = product[0].rating || { count: 0, sum: 0 };
            const newCount = currentRating.count + 1;
            const newSum = currentRating.sum + parseInt(req.body.rating);
            const newAverage = newSum / newCount;

            await dbClient.updateData(
                constants.collections.PRODUCTS,
                { title: req.body.title },
                {
                    $set: {
                        rating: {
                            count: newCount,
                            sum: newSum,
                            average: newAverage,
                        },
                    },
                }
            );

            res.status(200).send("Product rated successfully");
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
    }
);

export default productRouter;
