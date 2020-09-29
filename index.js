const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin');
require('dotenv').config();
const port = 5000;

var serviceAccount = require("./configs/burj-al-arab-86182-firebase-adminsdk-4e0w5-6f86235a4e.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: FIRE_DB,
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dpnco.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

app.use(cors());
app.use(bodyParser.json());

client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.get('/bookings', (req, res) => {
        console.log(req.headers.authorization);
        const bearer = req.headers.authorization;
        if(bearer && bearer.startsWith('Bearer ')){
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    if(tokenEmail === req.query.email) {
                        bookings.find({email: req.query.email})
                        .toArray((err, documents) => {
                            res.status(200).send(documents);
                        })
                    }
                    else {
                        res.status(401).send('Unauthorized access');
                    }
                }).catch(function (error) {
                    res.status(401).send('Unauthorized access');
                });
        }
        else {
            res.status(401).send('Unauthorized access');
        }

    })

});

app.listen(port);