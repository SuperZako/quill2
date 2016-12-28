// import Parchment from 'parchment';

let _config = {
    scope: /*Parchment*/Registry.Scope.BLOCK,
    whitelist: ['right', 'center', 'justify']
};

let AlignAttribute = new /*Parchment.Attributor.*/Attributor('align', 'align', _config);
let AlignClass = new /*Parchment.Attributor.*/ClassAttributor('align', 'ql-align', _config);
let AlignStyle = new /*Parchment.Attributor.*/StyleAttributor('align', 'text-align', _config);

// export { AlignAttribute, AlignClass, AlignStyle };