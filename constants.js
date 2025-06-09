const constants = {
    PORT: 3000,
    DB_URI: "mongodb+srv://ssz:ssz_27@cluster0.ilcjtjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    DB_NAME: "mini_ecom",
    roles: {
        CUSTOMER: "customer",
        ADMIN: "admin",
    },
    collections: {
        USERS: "users",
        PRODUCTS: "products",
        CARTS: "carts",
        ORDERS: "orders",
    },
    JWT_SECRET: "ssz_secret",
    discounts: {
        AMOUNT100: 100,
        AMOUNT200: 200
    }
}

export default constants;