
##ELF-WALKER-EXPERIMENT
This program just walks through all the depedency tree of libraries of an ELF file, trying to resolve all external symbols found in its way.
This was a tool I wrote to know exactly which dynamic libraries will I need to compile in hardfp ABI on ARM platform and if all symbols are really resolved. It helped me a lot while working on implementing HardFP-ABI into FirefoxOS.
It will finally lists all the symbols it couldn't resolve, all the dynamic libraries the binary depends on (dependency tree), and a usefull list of "adb push" commands to save me time copying these libraries to the device.

Do not expect a very much clean, tested or even smart code here... this was just a sort of experiment :)

###INSTALL
Clone this repo and run like:
    nodejs ./dependencywalker.js <Path to ELF file> <Path to .so location dir> [Path to .so location dir] ... [Path to .so location dir]

It needs [sysvelf](https://github.com/sifteo/node-elf) module to work but it's alredy included, though.

###THANKS TO
[Sifteo](https://github.com/sifteo) for his amazing tool - sysvelf. I just extended it to parse the contents of some of the sections I needed to do my job.

###CREDITS
[Jared Hanson](http://github.com/jaredhanson)

###LICENSE
[The MIT License](http://opensource.org/licenses/MIT)


Copyright (c) 2015 Juan Gomez Mosquera. <[@Longor](https://twitter.com/Longor)>


Enjoy!
