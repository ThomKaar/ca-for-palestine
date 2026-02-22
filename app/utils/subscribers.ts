import { MongoClient, ServerApiVersion } from 'mongodb';
import type { Subscriber } from '../types/main.ts';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.leczs8l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const dbName = 'ca-for-palestine-metrics';
const collectionName = 'subscribers';

function makeClient() {
    return new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });
}

export async function createSubscriber(doc: Omit<Subscriber, '_id'>): Promise<void> {
    const client = makeClient();
    try {
        await client.connect();
        const collection = client.db(dbName).collection(collectionName);
        await collection.insertOne(doc);
    } finally {
        await client.close();
    }
}

export async function verifySubscriber(verifyToken: string): Promise<boolean> {
    const client = makeClient();
    try {
        await client.connect();
        const collection = client.db(dbName).collection(collectionName);
        const result = await collection.findOneAndUpdate(
            { verifyToken, verified: false, active: true },
            { $set: { verified: true } },
            { returnDocument: 'after' }
        );
        if (!result) return false;
        // Compute nextSendAt now that subscriber is verified
        const daysInterval = Math.floor(7 / (result.sendsPerWeek as number));
        const nextSendAt = new Date();
        nextSendAt.setDate(nextSendAt.getDate() + daysInterval);
        await collection.updateOne(
            { verifyToken },
            { $set: { nextSendAt } }
        );
        return true;
    } finally {
        await client.close();
    }
}

export async function unsubscribe(unsubscribeToken: string): Promise<boolean> {
    const client = makeClient();
    try {
        await client.connect();
        const collection = client.db(dbName).collection(collectionName);
        const result = await collection.updateOne(
            { unsubscribeToken },
            { $set: { active: false } }
        );
        return result.modifiedCount > 0;
    } finally {
        await client.close();
    }
}

export async function getDueSubscribers(): Promise<Subscriber[]> {
    const client = makeClient();
    try {
        await client.connect();
        const collection = client.db(dbName).collection<Subscriber>(collectionName);
        return await collection
            .find({ active: true, verified: true, nextSendAt: { $lte: new Date() } })
            .toArray();
    } finally {
        await client.close();
    }
}

export async function updateAfterSend(subscriberId: string, sendsPerWeek: 2 | 3): Promise<void> {
    const client = makeClient();
    try {
        await client.connect();
        const { ObjectId } = await import('mongodb');
        const collection = client.db(dbName).collection(collectionName);
        const now = new Date();
        const daysInterval = Math.floor(7 / sendsPerWeek);
        const nextSendAt = new Date(now);
        nextSendAt.setDate(nextSendAt.getDate() + daysInterval);
        await collection.updateOne(
            { _id: new ObjectId(subscriberId) },
            { $set: { lastSentAt: now, nextSendAt } }
        );
    } finally {
        await client.close();
    }
}

export async function ensureIndexes(): Promise<void> {
    const client = makeClient();
    try {
        await client.connect();
        const collection = client.db(dbName).collection(collectionName);
        await collection.createIndex({ nextSendAt: 1, active: 1, verified: 1 });
        await collection.createIndex(
            { createdAt: 1 },
            { expireAfterSeconds: 86400, partialFilterExpression: { verified: false } }
        );
    } finally {
        await client.close();
    }
}
