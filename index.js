const express = require("express");
const multer = require("multer");
const path = require("path");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const bodyParser= require('body-parser');
require("dotenv").config();
const cors = require("cors");

const UPLOADS_FOLDER = "./uploads";

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
      cb(null, UPLOADS_FOLDER);
    },

    filename: (req, file, cb) => {
       const fileExt = path.extname(file.originalname);
       const fileName = file.originalname
                            .replace(fileExt, "")
                            .toLowerCase()
                            .split(" ")
                            .join("-") + "-" + Date.now();
        cb(null, fileName + fileExt);
    },
});

var upload = multer({
  storage:storage,
  limits : {
     fileSize : 1000000, // 1MB
  },
  
  fileFilter : (req, file, cb) => {

    if(
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    ) {
        cb(null, true);
      } else {
        cb(new Error("Only .jpg, .png or .jpeg format are allowed!"));
      }
  },

});


const app = express();

const port = process.env.PORT || 5000;

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6jqkzzd.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const db = client.db("progHero");
    const userCollection = db.collection("user");

    app.get("/users", async (req, res) => {
      const cursor = userCollection.find({});
      const result = await cursor.toArray();
      res.send({status:true, data : result});
    });

    app.post("/user", upload.fields([
      {name:'image1', maxCount:1},
      {name:'image2', maxCount:1},
      {name:'image3', maxCount:1},
    ]), async (req, res) => {
      

      const {fullName, email, age, phone, address, area, vehicleName, vehicleModel, namePlate, term} = req.body;
      const files = req.files;
      console.log("Count-->",files);

      // const data = {
      //   fullName:req.body.fullName,
      //   email:req.body.email,
      //   age:req.body.age,
      //   phone:req.body.phone,
      //   address:req.body.address,
      //   vehicleName:req.body.vehicleName,
      //   vehicleModel:req.body.vehicleModel,
      //   namePlate:req.body.namePlate,
      //   term:req.body.term,
      //   files:req.files.map((file ) => {
      //     return{
      //       filename:file.originalname,
      //       mimeType:file.mimetype,
      //       data:file.buffer,
      //     };
      //   }),
      // };

      const result = await userCollection.insertOne({fullName, email, age, phone, address, area, vehicleName, vehicleModel, namePlate, term, files});
      // console.log("backend result",result)
      res.send(result);

      // const result = await userCollection.insertOne(data);
      // res.send(result);


    });


    app.get("/user", async (req, res) => {
      const fullName = req.body.fullName;
      const result = await userCollection.findOne({fullName });

        return res.send({ status: true, data: result });
    
    });

    app.get("/user/:id", async (req, res) => {

      const id = req?.params?.id;
      const result = await userCollection.findOne({_id:ObjectId(id)});
        return res.send({ status: true, data: result });
    
    });

    app.delete("/user/:id", async (req, res) => {
      
      const id = req.params.id;
      const result = await userCollection.deleteOne({_id:ObjectId(id)});

        return res.send({ status: true, message:"Successfully deleted!" });
    
    });

    app.get("/user/:age", async (req, res) => {
      
      const age = req.params.age;
      // console.log(age)
      const result = await userCollection.find({age: {$gte:18, $lte:25 } });

        return res.send({ status: true, data: result });
    
    });

    

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      if (result?.email) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });

    app.get("/user", async (req, res) => {
      const phone = req.body.phone;
      const result = await userCollection.findOne({ phone : phone });
      if (result?.phone) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });


    app.use((err, req, res, next) => {
      if(err){
        if(err instanceof multer.MulterError) {
          res.status(500).send("There was an upload error!");
        }
         else{
          res.status(500).send(err.message);
         }
      }else{
        res.send("Success");
      }
    })

   
    
  } finally {
  }
};

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
