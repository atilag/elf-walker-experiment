/**
 * This is a very simple Dynamic Symbol Section parser for 32 bits ELF files.
 * Unresolved syumbols have a 0x00 value in their shndx field.
 *
 * @author Juan Gomez Mosquera <atilag@gmail.com>
 */
var Buffer = require('buffer').Buffer;

/* http://wiki.osdev.org/ELF_Tutorial#The_Symbol_Table */
/* 
typedef struct {
	Elf32_Word		st_name;  (__u32)
	Elf32_Addr		st_value; (__u32)
	Elf32_Word		st_size; (__u32)
	uint8_t			st_info; 
	uint8_t			st_other;
	Elf32_Half		st_shndx; (__u16)
} Elf32_Sym;
*/
function Elf32Symbol(buff, symbolStrings){
	this.nameOffset = buff.readUInt32LE(0);
	this.name = symbolStrings[this.nameOffset.toString()];
	this.value = buff.readUInt32LE(4);
	this.size = buff.readUInt32LE(8);
	this.info = buff.readUInt8(12);
	this.other = buff.readUInt8(13);
	this.shndx = buff.readUInt16LE(14);
}

Elf32Symbol.prototype.BLOCK_SIZE = 4 + 4 + 4 + 1 + 1 + 2;

Elf32Symbol.prototype.toString = function(){
	return "NameOffset: " + this.nameOffset +
		   " Name: " + this.name +
		   " Value: " + this.value + 
		   " Size: " + this.size +
		   " Info: " + this.info +
		   " Other: " + this.other +
		   " Shndx: " + this.shndx +
		   "\n";
}

/**
 * Constructor
 * @param  {String} dynBuff A binary buffer filled with the information of the Dynsym section extracted from the ELF file
 * @param  {String} strBuff This buffer contains the literals/names of the symbols extracted from the symBuff buffer.
 */
function DynsymSectionParser(symBuff, strBuff){
	this.symBuff = symBuff;
	this.symbolStrings = [];
	var that = this;
	var prev = 0;
	strBuff.toString().split("\0").forEach(function(element, index, array){
		that.symbolStrings[prev.toString()] = element;
		prev += element.length + 1;  //+1 because of '\0'
	});
}

/**
 * Parse the buffer with the symbols information from the DynSym section of and ELF file and creates an array of Elf32Symbol objects.
 * @param  {Function} cb Callback to be called when the array is filled with the symbol information
 */
DynsymSectionParser.prototype.parse = function( cb ){
	cb = cb || function(){};
	var read = 0;
	var symbols = [];
	var symBuffLength = this.symBuff.length;
	read = 0;
	while(read <= symBuffLength){
		var block = new Buffer(16);
		this.symBuff.copy(block, 0, read, read + block.length);
		var symbol = new Elf32Symbol(block, this.symbolStrings);
		symbols.push(symbol);
		read += block.length;
	}

	cb(null, symbols);
}

/**
 * This method will call the callback function every time it finds a new symbol
 * @param  {Function} cbEachIter Callback to be called every time a new symbols is found
  */
DynsymSectionParser.prototype.interactiveParse = function( cbEachIter ){

	cbEachIter = cbEachIter || function(){};
	var read = 0;
	var symBuffLength = this.symBuff.length;
	read = 0;
	while(read <= symBuffLength){
		var block = new Buffer(16);
		this.symBuff.copy(block, 0, read, read + block.length);
		var symbol = new Elf32Symbol(block, this.symbolStrings);
		cbEachIter(null, symbol);
		read += block.length;
	}
}


module.exports = DynsymSectionParser;
