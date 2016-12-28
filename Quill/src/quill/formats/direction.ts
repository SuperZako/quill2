// import Parchment from 'parchment';

let config = {
    scope: /*Parchment*/Registry.Scope.BLOCK,
    whitelist: ['rtl']
};

let DirectionAttribute = new /*Parchment.Attributor.Attribute*/Attributor('direction', 'dir', config);
let DirectionClass = new /*Parchment.Attributor.Class*/ClassAttributor('direction', 'ql-direction', config);
let DirectionStyle = new /*Parchment.Attributor.Style*/StyleAttributor('direction', 'direction', config);

// export { DirectionAttribute, DirectionClass, DirectionStyle };