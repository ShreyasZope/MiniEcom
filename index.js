import express from "express"
import cors from "cors"
import userRouter from "./modules/user.js"
import productRouter from "./modules/product.js"
import orderRouter from "./modules/order.js"
import cartRouter from "./modules/cart.js"
import constants from "./constants.js"

const app = express()

app.use(cors())

app.use(express.json())

app.get("/", (req, res) => {
    res.send("Server working.")
})

app.use("/users", userRouter)
app.use("/products", productRouter)
app.use("/orders", orderRouter)
app.use("/carts", cartRouter)


app.listen(3000, () => {
    console.log("Server is running on port: ", constants.PORT)
})

