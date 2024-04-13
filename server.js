const WebSocket=require("ws");
const fs=require("fs");
const app=require("express")();
app.get("/",(req,res)=>{res.sendFile(__dirname+"/index.html");});
app.get("/admin",(req,res)=>{res.sendFile(__dirname+"/admin.html");});
app.get("*",(req,res)=>{if(req.url!="/"&&req.url!="/admin"){res.sendFile(__dirname+req.url);}});

const wss=new WebSocket.Server({noServer:true});
wss.on("connection",async function connection(ws,req){
ws.on("message",async function incoming(data){
data=JSON.parse(data);
if(data.type=="get"){ws.send(JSON.stringify({type:"scores",initial:data.initial,content:fs.readFileSync("./scores.json",{encoding:"utf-8"})}));}
});
ws.on("close",async function incoming(data){});
});
fs.watchFile("./scores.json",(curr,prev)=>{wss.clients.forEach(client=>{client.send(JSON.stringify({type:"scores",updated:true,initial:false,content:fs.readFileSync("./scores.json",{encoding:"utf-8"})}));});});
const server=app.listen(80,()=>{console.log("Server started.");});
server.on("upgrade",(request,socket,head)=>{wss.handleUpgrade(request,socket,head,socket=>{wss.emit("connection",socket,request);});});
