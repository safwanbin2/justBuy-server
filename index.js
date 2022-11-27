// requiring all the stuffs
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// express app
const app = express();

// middlewares
app.use(express.json())
app.use(cors())

// url/uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6ua546u.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// verifying jwt token middleware
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(403).send({ message: "Unauthorized access" })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            res.status(403).send({ message: "Unauthorized access" })
        }
        req.decoded = decoded;
        next();
    })
}
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
const WishListCollection = client.db('justBuy').collection('wishlists')

// middleware for checking seller
function verifySeller(req, res, next) {
    const decoded = req.decoded;
    const filter = { email: decoded };
    const exist = UsersCollection.find(filter);
    if (!exist) {
        return res.status(401).send({ message: "forbidden access" })
    }
    next();
}
// middleware for checking admin
function verifyAdmin(req, res, next) {
    const decoded = req.decoded;
    const filter = { email: decoded };
    const exist = UsersCollection.findOne(filter);
    if (!exist) {
        return res.status(401).send({ message: "forbidden access" })
    }
    next();
}
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
// getting all the buers
app.get('/users', async (req, res) => {
    const role = req.query.role;
    const filter = { role: role }
    const result = await UsersCollection.find(filter).toArray();
    res.send(result)
})
// deleting user;
app.delete('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) }
        const result = await UsersCollection.deleteOne(filter);
        res.send(result)
    } catch (error) {
        console.log(error)
    }
})
// updating isVerified for user by admin
app.get('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) }
        const updateDoc = {
            $set: {
                isVerified: true
            }
        }
        const result = await UsersCollection.updateOne(filter, updateDoc, { upsert: true });
        res.send(result);
    } catch (error) {
        console.log(error)
    }
})
// getting verified seller
app.get('/users/seller/isverified', async (req, res) => {
    try {
        const email = req.query.email;
        const filter = { email: email };
        const exist = await UsersCollection.findOne(filter);
        if (exist.isVerified) {
            return res.send({ isVerified: true })
        }
        res.send({ isVerified: false })
    } catch (error) {
        console.log(error)
    }
})
// verifying seller and admin by useAdmin and useSeller
app.get('/users/admin/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const filter = { email: email };
        const exist = await UsersCollection.findOne(filter);
        if (exist.role == 'admin') {
            return res.send({ isAdmin: true });
        }
        res.status(401).send({ message: "forbidden access" });
    } catch (error) {
        console.log(error)
    }
})
app.get('/users/seller/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const filter = { email: email };
        const exist = await UsersCollection.findOne(filter);
        if (exist.role == 'seller') {
            return res.send({ isSeller: true })
        }
        else {
            res.status(401).send({ message: "forbidden access" });
        }
    } catch (error) {
        console.log(error)
    }
})
// posting for issuing jwt token
app.get('/jwt', async (req, res) => {
    try {
        const email = req.query.email;
        const token = jwt.sign(email, process.env.JWT_TOKEN_SECRET);
        res.send({ token });
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
app.get('/categories/:category', verifyJWT, async (req, res) => {
    try {
        const decoded = req.decoded;
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
app.post('/phones', verifyJWT, verifySeller, async (req, res) => {
    try {
        const newPhone = req.body;
        const result = await PhonesCollection.insertOne(newPhone);
        res.send(result);
    } catch (error) {
        console.log(error)
    }
})
// deleting phones with specific id
app.delete('/phones/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const result = await PhonesCollection.deleteOne(filter);
        res.send(result)
    } catch (error) {
        console.log(error)
    }
})
// updating phonse advertise status
app.get('/phones/advertise/:id', verifyJWT, async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) }
        const updateDoc = {
            $set: {
                isAdvertised: true
            }
        }

        const result = await PhonesCollection.updateOne(filter, updateDoc, { upsert: true })
        res.send(result)
    } catch (error) {
        console.log(error)
    }
})
// getting only advertised phones from phone collection
app.get('/phones/advertise', async (req, res) => {
    try {
        const filter = { isAdvertised: true };
        const result = await PhonesCollection.find(filter).toArray();
        res.send(result)
    } catch (error) {
        console.log(error)
    }
})
// getting user phones
app.get('/phones', async (req, res) => {
    try {
        const email = req.query.email;
        const query = { sellerEmail: email }
        const result = await PhonesCollection.find(query).toArray();
        res.send(result)
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
// getting specific booking with with id
app.get('/bookings/payment/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) }
        const result = await BookingCollection.findOne(filter);
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
// adding item to the wishlist
app.post('/wishlist', async (req, res) => {
    try {
        const newItem = req.body;
        const filter = { phoneId: newItem.phoneId, buyerEmail: newItem.buyerEmail };
        const exist = await WishListCollection.findOne(filter);
        if (exist) {
            return res.send({ message: "Item already exist in your wishlist" })
        }
        const result = await WishListCollection.insertOne(newItem);
        res.send(result);
    } catch (error) {
        console.log(error)
    }
})
// getting user specific wishlist according to email
app.get('/wishlist', async (req, res) => {
    try {
        const email = req.query.email;
        const filter = { buyerEmail: email }
        const result = await WishListCollection.find(filter).toArray();
        res.send(result)
    } catch (error) {
        console.log(error)
    }
})








// listing to the port
app.listen(port, () => {
    console.log(`justBuy server is running on ${port}`)
})