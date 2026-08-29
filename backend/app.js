require('dotenv').config();
import express from "express";
import multer from "multer";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

const app = express();

const upload = multer({storage: multer.memoryStorage()});

const llm = new ChatGoogleGenerativeAI({
    model : "gemini-2.5-flash",
    apiKey : process.env.GEMINI_API_KEY
})

app.post('/upload',upload.single("image"), async(req ,res)=>{
    try{
        if(!req.file){
            return res.status(400).send("No image uploaded")
        }

        const base64Image = req.file?.buffer.toString("base64");
        const mimiType = req.file?.mimetype;
        const imageDataURL = `data:${mimiType};base64,${base64Image}`

    }catch(err){

    }
})


app.listen(8000,()=>{
    console.log("Server Running....")
})