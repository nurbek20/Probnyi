import express from 'express';
import multer from "multer";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import UserModel from "./models/User.js";
import fs from "fs";
import {  checkAuth, handleValidationErrors } from './utils/index.js';
import { registerValidation, loginValidation } from './validation.js';
import adminRouter from "./routes/admin-router.js"
import bodyParser from 'body-parser';
const app = express();

app.use(express.json());
app.use(bodyParser.json());

mongoose
    .connect('mongodb+srv://admin:admin@cluster0.bkjm6hf.mongodb.net/user?retryWrites=true&w=majority')
    .then(() => console.log("DB ok"))
    .catch((err) => console.log("DB error", err))

app.post('/api/users/register',registerValidation,handleValidationErrors, async (req, res) => {
    try {
        const doc = new UserModel({
            fullName: req.body.fullName,
            email: req.body.email,
            password: req.body.password,
            imageUrl: req.body.imageUrl
        })
        const user = await doc.save()
        const token = jwt.sign({
            _id: user._id,
        },
            'secret123',
            {
                expiresIn: '30d',
            }
        );
        const { ...userData } = user._doc;
        res.json({
            ...userData,
            token
        })
    } catch (e) {
        console.log(e)
        res.status(500).json({
            message: 'Не удалось зарегистрироваться'
        })
    }
})

app.post("/api/users/login",loginValidation,handleValidationErrors, async (req, res) => {
    try {
        const user = await UserModel.findOne({ email: req.body.email })
        if (!user) {
            return res.status(400).json({
                message: "Пользователь не найден",
            })
        }
        const token = jwt.sign({
            _id: user._id,
        },
            'secret123',
            {
                expiresIn: '30d',
            }
        );
        const { passwordHash, ...userData } = user._doc;
        res.json({
            ...userData,
            token,
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Не удалось авторизоваться'
        })
    }

})

app.get("/api/users/me",checkAuth, async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId)
        if (!user) {
            return res.status(404).json({
                message: 'Ползователь не найден'
            })
        }
        const { ...userData } = user._doc;
        res.json(userData)
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: 'Нет доступа'
        })
    }
})

app.use("/admin", adminRouter )

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads');
      }
      cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
  });
  
  
  const upload = multer({ storage: storage, fileFilter: function(req, file, cb) {
      const filetypes = /jpeg|jpg|png/;
      const mimetype = filetypes.test(file.mimetype);
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb("Error: File upload only supports the following filetypes - " + filetypes);
    }
  });
  app.use('/uploads', express.static('uploads'));
  
  app.post('/upload',checkAuth, upload.single('file'), function(req, res) {
    res.send('File uploaded successfully');
  });

const PORT = process.env.PORT||4000 
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
