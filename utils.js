import jwt from "jsonwebtoken";
import constants from "./constants.js";

async function loginCheck(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(token, constants.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            console.log(error);
            res.status(401).json({ message: "Invalid token" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
}

function roleCheck(role) {
    return async (req, res, next) => {
        if (req.user && req.user.role === role) {
            next();
        } else {
            res.status(403).json({ message: "Forbidden" });
        }
    };
}

export { loginCheck, roleCheck };