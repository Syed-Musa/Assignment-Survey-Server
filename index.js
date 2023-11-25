const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jv3edzu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const FeaturedCollection = client.db('SurbeyPollDB').collection('FeaturedSurvey');
    const LatestCollection = client.db('SurbeyPollDB').collection('LatestSurvey');
    const SurveyCollection = client.db('SurbeyPollDB').collection('survey');

    app.post('/jwt', async(req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
      res.send({token});
    });

    // middlewares
    const verifyToken = (req, res, next) =>{
      console.log('inside verify token', req.headers);
      if(!req.headers.authorization){
        return res.status(401).send({message: 'unauthorized access'});
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
          return res.status(401).send({message: 'unauthorized access'})
        }
        req.decoded = decoded;
        next();
      })
    };

    app.get('/FeaturedSurvey', async(req, res)=>{
        const result = await FeaturedCollection.find().toArray();
        res.send(result);
    });

    app.get('/LatestSurvey', async(req, res)=>{
        const result = await LatestCollection.find().toArray();
        res.send(result);
    });

    app.get('/survey', async(req, res)=>{
        const result = await SurveyCollection.find().toArray();
        res.send(result);
    })

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res)=>{
    res.send('Survey server started')
});

app.listen(port, ()=>{
    console.log(`Survey resource server started on port ${port}`)
});