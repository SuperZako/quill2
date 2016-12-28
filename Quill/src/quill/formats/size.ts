// import Parchment from 'parchment';

let SizeClass = new /*Parchment.Attributor.Class*/ClassAttributor('size', 'ql-size', {
    scope: /*Parchment*/Registry.Scope.INLINE,
    whitelist: ['small', 'large', 'huge']
});
let SizeStyle = new /*Parchment.Attributor.Style*/StyleAttributor('size', 'font-size', {
    scope: /*Parchment*/Registry.Scope.INLINE,
    whitelist: ['10px', '18px', '32px']
});

// export { SizeClass, SizeStyle };