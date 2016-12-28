//import Parchment from 'parchment';

///<reference path='./color.ts' />
//import { ColorAttributor } from './color';

let BackgroundClass = new /*Parchment.Attributor.Class*/Attributor('background', 'ql-bg', {
    scope:/*Parchment*/Registry.Scope.INLINE
});
let BackgroundStyle = new ColorAttributor('background', 'background-color', {
    scope: /*Parchment*/Registry.Scope.INLINE
});

//export { BackgroundClass, BackgroundStyle };