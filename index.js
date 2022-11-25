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
const UsersCollection = client.db('justBuy').collection('users');
const BookingCollection = client.db('justBuy').collection('bookings');

// devs api calls 
// users api calls
app.post('/users', async (req, res) => {
    try {
        const userData = req.body;
        const query = { email: userData.email }
        const exist = await UsersCollection.findOne(query);
        if (!exist) {
            const result = await UsersCollection.insertOne(userData);
            res.send(result)
        }
    } catch (error) {
        console.log(error)
    }
})
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
// inserting phones
app.post('/phones', async (req, res) => {
    try {
        const newPhone = req.body;
        const result = await PhonesCollection.insertOne(newPhone);
        res.send(result);
    } catch (error) {
        console.log(error)
    }
})
// posting bookings
app.post('/bookings', async (req, res) => {
    try {
        const newBooking = req.body;
        const result = await BookingCollection.insertOne(newBooking)
        res.send(result)
    } catch (error) {
        console.log(error)
    }
})
// gettoing my orders
app.get('/myorders', async (req, res) => {
    try {
        const email = req.query.email;
        const filter = { buyerEmail: email }
        const result = await BookingCollection.find(filter).toArray();
        res.send(result)
    } catch (error) {
        console.log(error)
    }
})










// listing to the port
app.listen(port, () => {
    console.log(`justBuy server is running on ${port}`)
})