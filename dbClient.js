import { MongoClient, ObjectId } from "mongodb";
import constants from "./constants.js";

const client = new MongoClient(constants.DB_URI);

async function getConnection() {
    if (!client.isConnected) {
        await client.connect();
    }

    return client;
}

async function readData(collectionName, filter = {}) {
    const client = await getConnection();
    const db = client.db(constants.DB_NAME);
    const collection = db.collection(collectionName);
    const data = await collection.find(filter).toArray();
    return data;
}

async function addData(collectionName, data) {
    const client = await getConnection();
    const db = client.db(constants.DB_NAME);
    const collection = db.collection(collectionName);
    const result = await collection.insertOne(data);
    return result;
}

async function updateData(collectionName, filter, update) {
    const client = await getConnection();
    const db = client.db(constants.DB_NAME);
    const collection = db.collection(collectionName);
    const result = await collection.updateMany(filter, update);
    return result;
}

async function deleteData(collectionName, filter) {
    const client = await getConnection();
    const db = client.db(constants.DB_NAME);
    const collection = db.collection(collectionName);
    const result = await collection.deleteMany(filter);
    return result;
}


export default {
    getConnection,
    readData,
    addData,
    updateData,
    deleteData
};