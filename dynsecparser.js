/**
* This is a very simple ELF Dynamic section parser. 
* It just resolves the names of the library dependencies.
* Each section entry in the dynamic section has two fields: tag and value.
* Library dependencies have 0x01 tag values, and the value field is an offset 
* which points to a litreal string, the name of the library.
*
* @author Juan Gomez Mosquera <atilag@gmail.com>
*/

var Buffer = require('buffer').Buffer;

/*
http://lxr.free-electrons.com/source/include/uapi/linux/elf.h#L137

typedef struct dynamic{
   Elf32_Sword d_tag;    4-bytes
   union{
     Elf32_Sword d_val;  4-bytes
     Elf32_Addr  d_ptr;
   } d_un;
} Elf32_Dyn;
*/

function DynSectionEntry(buff, dynamicStrings){
	this.tag = buff.readInt32LE(0);
	this.value = buff.readUInt32LE(4);
	if( this.tag == 0x01 ){
		this.name = dynamicStrings[this.value.toString()];
	}
}

DynSectionEntry.prototype.BLOCK_SIZE = 4 + 4;

DynSectionEntry.prototype.toString = function(){
	return "Tag: " + this.tag +
		   " Value/Pointer: " + this.name +
		   "\n";
}

/**
 * Constructor
 * @param  {String} dynBuff A binary buffer filled with the information of the Dynamic section extracted from the ELF file
 * @param  {String} strBuff This buffer contains the literals/names of the external libraries extracted from the dynBuff buffer.
 */
function DynSectionParser(dynBuff, strBuff){
	this.dynBuff = dynBuff;
	this.dynamicStrings = [];
	var that = this;
	var prev = 0;
	strBuff.toString().split("\0").forEach(function(element, index, array){
		that.dynamicStrings[prev.toString()] = element;
		prev += element.length + 1;  //+1 because of '\0'
	});
}

/**
 * Parse the buffer with the information from the Dynamic section of and ELF file and creates an array of dependant .so libraries
 * @param  {Function} cb Callback to be called when the array is filled with all the libraries found
 */
DynSectionParser.prototype.parse = function( cb ){
	cb = cb || function(){};
	var read = 0;
	var sections = [];
	var dynBuffLength = this.dynBuff.length;
	read = 0;
	while(read <= dynBuffLength){
		var block = new Buffer(8);
		this.dynBuff.copy(block, 0, read, read + block.length);
		var section = new DynSectionEntry(block, this.dynamicStrings);
		sections.push(section);
		read += block.length;
	}
	cb(null, sections);
}

/**
 * This method will call the callback function every time it finds a new dependant external library
 * @param  {Function} cbEachIter Callback to be called every time a new library is found is found
  */
DynSectionParser.prototype.interactiveParse = function( cb ){
	cb = cb || function(){};
	var read = 0;
	var dynBuffLength = this.dynBuff.length;
	read = 0;
	while(read <= dynBuffLength){
		var block = new Buffer(8);
		this.dynBuff.copy(block, 0, read, read + block.length);
		var section = new DynSectionEntry(block, this.dynamicStrings);
		cb(null, section);
		read += block.length;
	}
}

module.exports = DynSectionParser;
