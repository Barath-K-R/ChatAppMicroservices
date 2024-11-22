import express from 'express'
import cors from 'cors'
import proxy from 'express-http-proxy'

 const app=express()

 app.use(express.json());


const chatService = 'http://localhost:5001';
const userService = 'http://localhost:5002';
const messageService = 'http://localhost:5003';
const organizationService = 'http://localhost:5004';
const threadService = 'http://localhost:5005';

app.use('/chats', proxy(chatService));

app.use('/users', proxy(userService));

app.use('/messages', proxy(messageService));

app.use('/organization', proxy(organizationService));

app.use('/threads', proxy(threadService, ));

app.get('/',(req,res)=>{
    res.json({message:'hello world'})
})
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

 app.listen(8000,()=>{
    console.log('gateway is listtening on port 8000');
 })