import { MongoClient, ServerApiVersion } from 'mongodb';
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.leczs8l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const dbName = 'ca-for-palestine-metrics';
const collectionName = 'emailsSent';
const experimentCollectionName = 'formFillExperimentRuns';
interface EmailMetric {
    variant?: string;
    topics?: string[];
    topicModel?: string;
    topicTaggingStatus?: 'tagged' | 'unavailable';
    durationMs?: number;
}

async function connectAndPost(rep: string, metric: EmailMetric = {}) {
    let client;
    try {
        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });

        await client.connect();
        const database = await client.db(dbName);
        const collection = database.collection(collectionName);
        await collection.insertOne({ rep, ...metric, createdAt: new Date() });
        return;
    } catch (err) {
        console.log(err);
    } finally {
        await client?.close?.();
    }
    
}
async function connectAndCountReps(rep: string) {
    let client;
    try {
         client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });

        await client.connect();
        const database = await client.db(dbName);
        const collection = database.collection(collectionName);
        const count  = await collection.countDocuments({ rep: rep });
        return count;
     } catch (err) {
        console.log(err);
        return -1;
    } finally {
        await client?.close?.();
    }
}

interface FormFillExperimentMetric {
    rep: string;
    variant: string;
    outcome: 'success' | 'failure';
    durationMs: number;
    topics: string[];
    topicModel?: string;
    topicTaggingStatus: 'tagged' | 'unavailable';
    errorType?: string;
}

async function connectAndPostExperiment(metric: FormFillExperimentMetric) {
    let client;
    try {
        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        await client.connect();
        const database = await client.db(dbName);
        await database.collection(experimentCollectionName).insertOne({ ...metric, createdAt: new Date() });
    } catch (err) {
        console.log(err);
    } finally {
        await client?.close?.();
    }
}

export { connectAndPost, connectAndCountReps, connectAndPostExperiment };
