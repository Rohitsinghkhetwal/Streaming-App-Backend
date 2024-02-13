import express from "express";
import dotenv from "dotenv";
import {genSaltSync, hashSync} from "bcrypt";
import { StreamChat } from "stream-chat";



dotenv.config();
const app = express();
app.use(express.json())

const salt = genSaltSync(10);

const { PORT, STREAM_API_KEY, STREAM_API_SECRET } = process.env;
const client = StreamChat.getInstance(STREAM_API_KEY!, STREAM_API_SECRET)

interface User {
    id: string,
    email: string,
    hashed_password: string

}

const USER: User[] = [];


app.post("/register", async(req, resp) => {
    const {email, password} = req.body;
    if(!email || !password){
        resp.status(500).json({message: "email and password required !"})
    }

    if(password.length < 6){
        resp.status(500).json({message: "Please keep strong password "})
    }
     const result = USER.find((user) => user.email === email);
     if(result){
        return resp.status(400).json({ message: "user already exist !" });

     }
      
    try{
        const hashed_password = hashSync(password, salt);
        const id = Math.random().toString(36).slice(2);
        const newUser = {
            id,
            email,
            hashed_password
        }
        USER.push(newUser);  
        await client.upsertUser({
            id,
            email,
            name: email
        })

        const token = client.createToken(id);

        return resp
        .status(200)
        .json({token, 
        user: {
            id,
            email,
        }
        })

    }catch(error){
        resp.status(500).json({message: "Some error occur !"})

    }

})

app.post("/login", (req, resp) => {
    const {email, password} = req.body;
    const user = USER.find((user) => user.email === email);
    const hashed_password = hashSync(password, salt);
    if(!user || user.hashed_password !== hashed_password){
        return resp.status(400).json({message: "invalid credentials"})
    }

    const token = client.createToken(user.id);
    return resp
    .status(200)
    .json({
        token,
        user: {
            id: user.id,
            email: user.email
        }
    })


})

app.listen(PORT, () => {
    console.log(`Listning on port ${PORT}`);
})

