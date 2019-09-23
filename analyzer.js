const fs = require('fs');
const config = {
	fileType:'.c',
	path:'./src'
}


let getFiles = ()=>{
	return fs.readdirSync(config.path).filter(m=>isValidFile(m));
}


let isValidFile = file=>file.substr(file.length-config.fileType.length) === config.fileType;


let findMenuExploit = fileName=>{
	let lines = fs.readFileSync(config.path + '/' + fileName).toString('utf8').split('\n');
	let hits = [];
	let curls = new Stack();
	let lastWasCreate = false;
	lines.forEach((line,i)=>{
		let inQuotes = false;
		let lastChar;
		[...line].forEach(c=>{
			if(c === '"' && !(lastChar === '\\' || lastChar === "'")) inQuotes = !inQuotes;		
			if(!inQuotes && c === '{' && lastChar !== "'") curls.push('{');
			else if(!inQuotes && c === '}' && lastChar !== "'"){
				if(curls.length() === 0){
					console.error(`Closing } without a corresponding open one in ${fileName} line ${i}.`);
					//process.exit();
				}
				curls.pop();
			}
			lastChar = c;
		});
		if(!curls.length()) hits = [];
		if(line.includes('create_nhwindow')){
			if(line.split('=').length < 2) console.log(`create_nhwindow called but not assigned in ${fileName} line ${i}.`);
			let variable = line.split('=')[0].trim();
			let split = variable.split(' ');
			variable = split[1] || variable;
			hits.push(new nhWindow(curls.length(),variable,i));
			lastWasCreate = true;

		} else 
		if(line.includes('return') && hits.length && !lastWasCreate){
			console.log(`Returned before destroy_nhwindow in ${fileName} line ${i}.`);
			lastWasCreate = false;
		} else 
		if(line.includes('destroy_nhwindow')){
			if(!hits.length) return console.error(`destroy_nhwindow  called with none created in ${fileName} line ${i}.`);
			let nhwindow = hits.find(m=>line.includes(m.variable)); //&& curls.length() === m.indent);
			//if(nhwindow){
				hits = hits.filter(n=>n!==nhwindow);
				lastWasCreate = false;
			//}
		} else {
			lastWasCreate = false;
		}
	});
	//console.log(hits.length);

}



class nhWindow{
	constructor(indent,variable,line){
		this.indent = indent;
		this.variable = variable;
		this.line = line;
	}

}


class Stack{
	constructor(){
		this.array = [];
    }
	push(e){
		this.array.push(e);
    }
	pop(){
		return this.array.pop()
    }
	peek(){
		return this.array[this.array.length-1];
    }
	length(){
		return this.array.length;
	}

}
let analyze = ()=>{
	getFiles().forEach(file=>{
		findMenuExploit(file);
	});
	//findMenuExploit('spell.c');

}
analyze();