import { MongoClient, ServerApiVersion } from 'mongodb';
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.leczs8l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const dbName = 'ca-for-palestine-metrics';
const collectionName = 'emailsSent';
async function connectAndPost(rep) {
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
        await collection.insertOne({ rep });
        return;
    } catch (err) {
        console.log(err);
    } finally {
        await client?.close?.();
    }
    
}
 
export default connectAndPost;