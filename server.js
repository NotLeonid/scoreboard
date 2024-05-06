const WebSocket=require("ws");
const fs=require("fs");
const app=require("express")();
const JSONdb=require("simple-json-db");
const db=new JSONdb("./scores.json");

app.get("/",(req,res)=>{res.sendFile(__dirname+"/index.html");});
app.get("/admin",(req,res)=>{res.sendFile(__dirname+"/admin.html");});
app.get("*",(req,res)=>{if(req.url!="/"&&req.url!="/admin"){res.sendFile(__dirname+req.url);}});

const wss=new WebSocket.Server({noServer:true});
wss.on("connection",async function connection(ws,req){
ws.on("message",async function incoming(data){
data=JSON.parse(data);
if(data.type=="get"){ws.send(JSON.stringify({type:"scores",initial:data.initial,content:fs.readFileSync("./scores.json",{encoding:"utf-8"})}));}
if(data.type=="change"){
if(data.name=="name"){db.set("name",data.content);}
if(data.name=="round"){db.set("round",data.content);}
}
if(data.type=="timer"){
if(data.action=="start"){
var temp=await db.get("timer");
temp.until=data.content;
temp.frozenAt=-1;
db.set("timer",temp);
}
if(data.action=="freeze"){
var temp=await db.get("timer");
temp.frozenAt=data.content;
db.set("timer",temp);
}
if(data.action=="clear"){
var temp=await db.get("timer");
temp.until=-1;
temp.frozenAt=-1;
db.set("timer",temp);
}
}
if(data.type=="team"){
if(data.action=="activate"){
var temp=await db.get("teams");
temp[data.content].active=!temp[data.content].active;
db.set("teams",temp);
}
if(data.action=="next"){
var temp=await db.get("teams");
temp[data.content].next=!temp[data.content].next;
db.set("teams",temp);
}
if(data.action=="score"){
var temp=await db.get("teams");
temp[data.id].score=data.content;
db.set("teams",temp);
}
}
});
ws.on("close",async function incoming(data){});
});
fs.watchFile("./scores.json",(curr,prev)=>{wss.clients.forEach(client=>{client.send(JSON.stringify({type:"scores",updated:true,initial:false,content:fs.readFileSync("./scores.json",{encoding:"utf-8"})}));});});
const server=app.listen(80,()=>{console.log("Server started.");});
server.on("upgrade",(request,socket,head)=>{wss.handleUpgrade(request,socket,head,socket=>{wss.emit("connection",socket,request);});});
