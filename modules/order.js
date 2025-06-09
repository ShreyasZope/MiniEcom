import express from "express";
import { loginCheck, roleCheck } from "../utils.js";
import constants from "../constants.js";
import { sendEmail } from "../mailer.js";
import dbClient from "../dbClient.js";

const orderRouter = express.Router();

orderRouter.post(
    "/placeOrder",
    loginCheck,
    roleCheck(constants.roles.CUSTOMER),
    async (req, res) => {
        try {
            let cart = await dbClient.readData(constants.collections.CARTS, {
                username: req.user.username,
            });

            if (!cart?.length) {
                return res.status(400).send("Cart is empty");
            }

            let totalPrice = await findTotalCartPrice(req.user.username);
            if (req.body.discountCoupen) {
                totalPrice =
                    totalPrice - constants.discounts[req.body.discountCoupen];
            }

            const orderItems = cart.map((item) => {
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                };
            });

            await dbClient.addData(constants.collections.ORDERS, {
                username: req.user.username,
                items: orderItems,
                orderDate: new Date(),
                totalPrice: totalPrice,
            });

            await dbClient.deleteData(constants.collections.CARTS, {
                username: req.user.username,
            });

            sendEmail(
                req.user.email,
                "Order Placed",
                "Your order has been placed successfully."
            );

            res.status(201).send("Order placed successfully");
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
    }
);

orderRouter.get(
    "/getOrders",
    loginCheck,
    roleCheck(constants.roles.CUSTOMER),
    async (req, res) => {
        try {
            let dateFilter = {};
            if (req.query.fromDate) {
                dateFilter = {
                    orderDate: {
                        $gte: new Date(req.query.fromDate),
                    },
                };
            }
            if (req.query.toDate) {
                dateFilter = {
                    orderDate: {
                        ...dateFilter.orderDate,
                        $lte: new Date(req.query.toDate),
                    },
                };
            }

            let orders = await dbClient.readData(constants.collections.ORDERS, {
                username: req.user.username,
                ...dateFilter,
            });
            res.status(200).json(orders);
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
    }
);

async function findTotalCartPrice(username) {
    const connection = await dbClient.getConnection();
    const db = connection.db(constants.DB_NAME);
    let total = await db
        .collection(constants.collections.CARTS)
        .aggregate([
            {
                $match: {
                    username: username,
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

    return total[0]?.totalCartPrice || 0;
}

export default orderRouter;
