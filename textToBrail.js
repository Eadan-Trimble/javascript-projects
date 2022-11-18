// Converts text to brail and Writes to port
// scr PortNumber Message
// Only implemented lowercase
const brail = {a: '⠁',b: '⠃',c: '⠉',d: '⠙',e: '⠑',f: '⠋',g: '⠛',h: '⠓',i: '⠊',j: '⠚',k: '⠅',l: '⠇',m: '⠍',n: '⠝',o: '⠕',p: '⠏',q: '⠟',r: '⠗',s: '⠎',t: '⠞',u: '⠥',v: '⠧',w: '⠺',x: '⠭',y: '⠽',z: '⠵',['-']: '⠤',};export function toBR( text){let newStr = '';for (let i=1; i< text.length; ++i){	newStr= newStr+ brail[text.at(i)];};return newStr;};export function main(ns){ns.writePort( ns.args[ 0], toBR( ns.args[ 1]));};
