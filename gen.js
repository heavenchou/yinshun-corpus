const {createCorpus}=require("ksana-corpus-builder");
const fs=require("fs");
const sourcepath="xml/";
const maxfile=0;
var files=require("./filelist")(maxfile);
//for (var i=0;i<39;i++) files.shift();
//files.length=1;
const bilink=require("./bilink");

const bookStart=function(){
	noteReset.call(this);
}
const bookEnd=function(){
}

const body=function(tag,closing){
	closing?this.stop():this.start();
}
const onToken=function(token){
	//console.log(token);
	//return null for stop words
	//return " " for empty token, increase tpos but no inverted is created
	return token;
}

const fileStart=function(fn,i){
	const at=fn.lastIndexOf("/");
	console.log(fn)
	fn=fn.substr(at+1);
	fn=fn.substr(0,fn.length-4);//remove .xml
	var kpos=this.nextLineStart(this.kPos); //this.kPos point to last char of previos file
	this.putField("file",fn,kpos);
}

const bigrams={};
const linkTo={"taisho":[]};//list of articles has bilink to taisho, for taisho to build reverse link

require("./bigrams").split(" ").forEach((bi)=>bigrams[bi]=true);

//build bigram if not exists
const bilinkfield="bilink@taisho";
var options={name:"yinshun",inputFormat:"xml",bitPat:"yinshun",title:"印順法師佛學著作集",
maxTextStackDepth:3,
articleFields:["ptr","def","note","link","noteid","figure",bilinkfield],
//textOnly:true,
removePunc:true,
linkTo:linkTo,
extrasize:1024*1024*10, //for svg
autostart:false,bigrams}; //set textOnly not to build inverted
var corpus=createCorpus(options);

const {char,g,mapping}=require("./eudc");
const {div,collection,articlegroup,head,title,divfinalize}=require("./div");
const {p,lb,list,item}=require("./format");
const {note,ptr,ref,noteReset,notefinalize}=require("./note");
const {choice,sic,corr,orig,reg}=require("./choice");
const {graphic,figure}=require("./graphic");


const finalize=function(){
	divfinalize.call(this);
	notefinalize.call(this);
	linkTo.taisho=bilink.putbilink(this,bilinkfield);
}
corpus.setHandlers(
	//open tag handlers
	{body,list,item,div,collection,articlegroup,p,lb,title,head,mapping,char,g,note,
		choice,corr,sic,orig,reg,ptr,ref,graphic,figure}, 
	//end tag handlers
	{body,list,div,head,title,mapping,char,note,
		choice,corr,sic,orig,reg,ref,figure}, 
	//other handlers
	{bookStart,bookEnd,onToken,fileStart,finalize}  
);

files.forEach(fn=>corpus.addFile(sourcepath+fn));

corpus.writeKDB("yinshun.cor",function(byteswritten){
	console.log(byteswritten,"bytes written")
});

console.log(corpus.totalPosting,corpus.tPos);