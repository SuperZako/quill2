//import Parchment from 'parchment';

///<reference path='./color.ts' />
//import { ColorAttributor } from './color';

let BackgroundClass = new Parchment.ClassAttributor('background', 'ql-bg', {
    scope:Parchment.Scope.INLINE
});
let BackgroundStyle = new ColorAttributor('background', 'background-color', {
    scope: Parchment.Scope.INLINE
});

//export { BackgroundClass, BackgroundStyle };