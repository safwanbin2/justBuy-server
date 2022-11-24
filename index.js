// requiring all the stuffs
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

// express app
const app = express();

// middlewares
app.use(express.json())
app.use(cors())

// url/uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6ua546u.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// connecting mongodb to the server
async function run() {
    try {
        client.connect();
        console.log('mongo db connected')
    } catch (error) {
        console.log(error)
    }
}
run();

//api calls default
app.get('/', (req, res) => {
    res.send('justBuy server is running fine')
})
// all the collections 

const PhonesCollection = client.db('justBuy').collection('phones');
const CategoriesCollection = client.db('justBuy').collection('categories');

// devs api calls 
// loading on category title
app.get('/categories', async (req, res) => {
    try {
        const query = {}
        const data = CategoriesCollection.find(query);
        const result = await data.toArray();
        res.send(result);
    } catch (error) {
        console.log(error)
    }
})
// loading category specific phones
app.get('/categories/:category', async (req, res) => {
    try {
        const category = req.params.category;
        const query = { category: category }
        const data = PhonesCollection.find(query);
        const result = await data.toArray();
        res.send(result)
    } catch (error) {
        console.log(error)
    }
})



// listing to the port
app.listen(port, () => {
    console.log(`justBuy server is running on ${port}`)
})