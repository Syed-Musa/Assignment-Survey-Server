const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
// app.use(cors({
//   origin: [
//     "http://localhost:5173"
//   ],
//   credentials: true
// }));
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

    const userCollection = client.db('SurbeyPollDB').collection('users');
    const FeaturedCollection = client.db('SurbeyPollDB').collection('FeaturedSurvey');
    const LatestCollection = client.db('SurbeyPollDB').collection('LatestSurvey');
    const SurveyCollection = client.db('SurbeyPollDB').collection('survey');
    const FAQCollection = client.db('SurbeyPollDB').collection('faq');
    const reviewCollection = client.db('SurbeyPollDB').collection('reviews');

    app.post('/jwt', async(req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
      res.send({token});
    });

    // middlewares
    const verifyToken = (req, res, next) =>{
      console.log('inside verify token', req.headers.authorization);
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

    // user verify admin
    const verifyAdmin = async(req, res, next)=>{
      const email = req.decoded.email;
      const query = {email: email};
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      console.log(isAdmin)
      if(!isAdmin){
        return res.status(403).send({message: 'forbidden access'});
      }
      next();
    }

    app.get('/users',  async(req, res)=>{
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get('/users/admin/:email',  async(req, res)=>{
      const email = req.params.email;
      // if(email !== req.decoded.email){
      //   return res.status(403).send({message: 'forbidden access'})
      // }
      const query = {email: email};
      const user = await userCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role === 'admin';
      }
      res.send({admin});
    });

    app.post('/users', async(req, res)=>{
      const user = req.body;
      const query = {email: user?.email}
      const existingUser = await userCollection.findOne(query);
      if(existingUser){
        return res.send({message: 'user already exists', insertedId: null})
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    app.delete('/users/:id', verifyToken, verifyAdmin, async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })

    app.get('/FeaturedSurvey', async(req, res)=>{
        const result = await FeaturedCollection.find().toArray();
        res.send(result);
    });

    app.get('/LatestSurvey', async(req, res)=>{
        const result = await LatestCollection.find().toArray();
        res.send(result);
    });

    app.get('/faq', async(req, res)=>{
      const result = await FAQCollection.find().toArray();
      res.send(result);
    });

    app.get('/reviews', async(req ,res)=>{
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });

    app.get('/survey', async(req, res)=>{
        const result = await SurveyCollection.find().toArray();
        res.send(result);
    });

    app.get('/survey/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await SurveyCollection.findOne(query);
      res.send(result);
    });

    app.post('/survey',verifyToken, async(req, res)=>{
      const category = req.body;
      const result = await SurveyCollection.insertOne(category);
      res.send(result);
    });

    app.patch('/survey/:id', async(req, res)=>{
      const category = req.body;
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          title: category.title,
          voted: category.voted,
          description: category.description,
          Add_vote: category.Add_vote,
          Add_vote2: category.Add_vote2,
          image: category.image
        }
      };
      const result = await SurveyCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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