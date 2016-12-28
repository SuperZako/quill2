// import Parchment from 'parchment';

let config = {
    scope: Parchment.Scope.BLOCK,
    whitelist: ['rtl']
};

let DirectionAttribute = new Parchment.Attributor('direction', 'dir', config);
let DirectionClass = new Parchment.ClassAttributor('direction', 'ql-direction', config);
let DirectionStyle = new Parchment.StyleAttributor('direction', 'direction', config);

// export { DirectionAttribute, DirectionClass, DirectionStyle };