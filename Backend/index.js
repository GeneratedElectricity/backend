import express from "express";
import { PORT, mongoDBURL } from "./config.js";
import mongoose from 'mongoose';
import { User } from './models/user.js';
import { Poem } from "./models/poemm.js";
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(cookieParser());

const jwtAuth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  try {
    const decoded = jwt.verify(token, 'shhhh');
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

app.get("/auth/user-details/", jwtAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("-password"); 
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get('/poem/get/', jwtAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const poems = await Poem.find({ author: userId });
    res.status(200).json({
      count: poems.length,
      data: poems
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
});

app.post('/poem/create/', jwtAuth, async (req, res) => {
  try {
    const { title, poem } = req.body;
    const author = req.userId;

    if (!title || !poem) {
      return res.status(400).json({ message: "Title and poem are required" });
    }

    const newPoem = new Poem({
      title,
      poem,
      author
    });

    const savedPoem = await newPoem.save();
    res.status(201).json(savedPoem);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
});

app.post("/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!(email && password)) {
        return res.status(400).send("Send all the data");
      }
  
      const user = await User.findOne({ email });
  
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send("Invalid credentials");
      }
  
      const token = jwt.sign(
        { id: user._id },
        'shhhh',
        {
          expiresIn: "2h"
        }
      );
  
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 
        httpOnly: true, 
      };
  
      res.cookie("token", token, options);
  
      res.status(200).json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        }
      });
  
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
});
  

app.post("/auth/register", async (req,res) => {
    try {
        const {name, email, password} = req.body

        if (!req.body.name || !req.body.email || !req.body.password) {
            return res.status(400).send("please insert all information!");
        } else {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).send("USER ALREADY EXISTS");
            }
        }
        

        const myEncPassword =await bcrypt.hash(password,10)

        const user = await User.create({
            name,
            email,
            password: myEncPassword
        })

        const token = jwt.sign(
            {id: user._id,email},
            'shhhh',
            {
                expiresIn: "2h"
            }
        );

        user.token = token

        user.password = undefined
        res.status(201).send("User has been created!")

    } catch (error){
        console.log(error);
    }
})


mongoose.connect(mongoDBURL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
