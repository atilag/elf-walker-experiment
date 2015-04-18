/**
 * Main logic
 * @author Juan Gomez Mosquera <atilag@gmail.com>
 * 
 */

var elf = require('sysvelf');
var path = require('path');
var fs = require('fs');
var DynsymSectionParser = require('./dynsymparser.js');
var DynSectionParser = require('./dynsecparser.js');

if( process.argv.length < 3 ){
	console.log("Usage: nodejs " + path.basename(process.argv[1]) + " <Path to ELF file> <Path to .so location dir> <Path to .so location dir> ... ");
	process.exit(1);
}

var binary;
var paths = [];
process.argv.forEach(function(val, index, array){
	if(index == 2){
		binary = val;
		console.log("binary = " + binary);
	}else if(index > 2){
		paths.push(val)
	}
});

var allSymbols = [];
var dynamicSos = [];

function getSymbolsAndLibraries(binary, cb){
	cb = cb || function(){ };

	elf.load(binary, function(err, file){
		if(err){
			console.log("Error opening ELF file: Error = " + err.toString());
			cb(err);
		}

		file.readSection('.dynstr', function(err, strBuff){
			if(err){
				console.log("Error reading section .dynstr: Error = " + err);
				cb(err);
			}
			//Looking for the needed linked libreries
			file.readSection('.dynamic', function(err, dymBuff){
				if(err){
					console.log("Error reading section .dynamic: Error = " + err);
					cb(err);
				}

				var dynsec = new DynSectionParser(dymBuff, strBuff);
				dynsec.parse(function(err, sections){
					if(err){
						console.log("Error parsing .dynamic section. Error = " + err);
						cb(err);
					}

					dynamicSos.push.apply( dynamicSos, sections.filter(function(element, index, array){
						if(element.tag == 0x01 && element.name != ''){
							//Filter out libraries already in the list
							for(var i = 0; i < dynamicSos.length; i++ ){
								if(dynamicSos[i].name == element.name )
									return false;
							}
							element.processed = false;
							return true
						}
						return false;					
					}) );
				});
				//Let's look for the symbols
				file.readSection('.dynsym', function(err, symBuff){
					if(err){
						console.log("Error reading section .text: Error = " + err);
						cb(err);
					}

					var dynsym = new DynsymSectionParser(symBuff, strBuff);
					dynsym.parse(function(err, symbols){
						if(err){
							console.log("Error parsing .dynsym section. Error = " + err);
							cb(err);
						}

						allSymbols.push.apply( allSymbols, symbols.filter(function(element, index, array){
							//Is it an external symbol?
							if(element.shndx == 0x00){
								for(var i = 0; i < allSymbols.length; i++ ){
									if(allSymbols[i].name == element.name)
										return false; //Already pushed
								}
								element.resolved = false;
								return true //Save it
							}else{
								for(var i = 0; i < allSymbols.length; i++ ){
									//if the symbol is not external, look for unresolved...
									if(allSymbols[i].name == element.name){
										allSymbols[i].resolved = true; //found an unresolved, mark it as resolved
										return false;
									}
								}
								element.resolved = true
							}

							return true;					
						}) );

						cb(null, dynamicSos, allSymbols);
					});
				});
			});
		});
	}); //... I know, I Know... sort of callback hell, will use promises next time :)
}


function lookForUnresolvedSymbols(err, sections, symbols, cb){
	cb = cb || function(){};
	if(err)
		cb(err);

	paths.forEach(function(path, index, array){
		for(var i = 0; i < sections.length; i++ ){
			if(sections[i].processed == true)
				continue;

			console.log("Looking for: " + path + "/" + sections[i].name + "...");
			
			var fd = null;
			try{
				fd = fs.openSync( path  + "/" + sections[i].name, "r");
				fs.closeSync(fd);
				console.log(" EXISTS\n");
				sections[i].processed = true;
				getSymbolsAndLibraries(path + "/" + sections[i].name, function(err, sections, symbols, cb){
					lookForUnresolvedSymbols(err, sections, symbols, function(err){
						end(err, sections, symbols);
					});
				});
			}catch(e){
				console.log(" NOT FOUND IN THIS PATH\n");
			}
		}

	});

	cb(null);
}
	

function end(err, sections, symbols){
	if(err){
		throw err;
	}

	console.log("***********************************************************************************\n");

	symbols.forEach(function(element, index ,array){
		if(element.resolved == false)
			console.log(element.toString());
	});

	console.log("Found dynamic libraries:\n");
	console.log(sections.toString());

	console.log("Print push commands:\n")
	sections.forEach(function(element, index, array){
		console.log("adb push " + element.name + " /system/b2g/hard/lib");
	});
}

getSymbolsAndLibraries(binary, function(err, sections, symbols){
	lookForUnresolvedSymbols(err, sections, symbols, function(err){
		end(null, dynamicSos, allSymbols);
	});
});