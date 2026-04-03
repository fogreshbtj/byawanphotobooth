class Booth{
constructor(){
this.video = document.getElementById("video");
this.canvas = document.getElementById("canvas");
this.finalCanvas = document.getElementById("finalCanvas");

this.photos=[];
this.filter="none";

this.init();
}

init(){
document.getElementById("startBtn").onclick=()=>this.go("frameScreen");
document.getElementById("frameNext").onclick=()=>this.startCamera();

document.querySelectorAll(".frame").forEach(f=>{
f.onclick=()=>{
document.querySelectorAll(".frame").forEach(x=>x.classList.remove("active"));
f.classList.add("active");
};
});

document.querySelectorAll(".filters button").forEach(btn=>{
btn.onclick=()=>{
this.filter=btn.dataset.filter;
this.applyFilter();
};
});

document.getElementById("toPreview").onclick=()=>this.showResult();
document.getElementById("downloadBtn").onclick=()=>this.download();
document.getElementById("finishBtn").onclick=()=>this.finish();
}

go(id){
document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
document.getElementById(id).classList.add("active");
}

async startCamera(){
this.go("cameraScreen");

const stream = await navigator.mediaDevices.getUserMedia({video:true});
this.video.srcObject=stream;

await this.delay(1000);
this.session();
}

async session(){
this.photos=[];

for(let i=0;i<4;i++){
await this.countdown();
this.photos.push(this.capture());
this.shutter();
}

this.merge();
this.go("filterScreen");
this.applyFilter();
}

async countdown(){
const el=document.getElementById("countdown");
el.style.display="block";

for(let i=3;i>0;i--){
el.innerText=i;
await this.delay(1000);
}

el.style.display="none";
}

capture(){
const c=document.createElement("canvas");
const ctx=c.getContext("2d");

c.width=this.video.videoWidth;
c.height=this.video.videoHeight;
ctx.drawImage(this.video,0,0);

return c;
}

merge(){
const ctx=this.canvas.getContext("2d");

this.canvas.width=400;
this.canvas.height=1200;

this.photos.forEach((img,i)=>{
ctx.drawImage(img,0,i*300,400,300);
});
}

applyFilter(){
const ctx=this.canvas.getContext("2d");
ctx.filter=this.filter;
ctx.drawImage(this.canvas,0,0);
}

showResult(){
const ctx=this.finalCanvas.getContext("2d");

this.finalCanvas.width=this.canvas.width;
this.finalCanvas.height=this.canvas.height;

ctx.drawImage(this.canvas,0,0);

this.go("resultScreen");
}

download(){
const a=document.createElement("a");
a.href=this.finalCanvas.toDataURL();
a.download="photobooth.png";
a.click();
}

finish(){
this.go("endScreen");

setTimeout(()=>{
location.reload();
},5000);
}

shutter(){
const audio=new Audio("https://www.soundjay.com/camera/camera-shutter.mp3");
audio.play();
}

delay(ms){
return new Promise(r=>setTimeout(r,ms));
}
}

window.onload=()=>new Booth();