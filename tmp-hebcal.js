const { HDate } = require('hebcal');
const h = new HDate(5762, 4, 9);
console.log('toString', h.toString());
console.log('greg', h.greg());
console.log('year', h.getFullYear());
console.log('month', h.getMonth());
console.log('day', h.getDate());
const fromGreg = new HDate(new Date('2002-07-18'));
console.log('fromGreg', fromGreg.toString(), fromGreg.greg());
