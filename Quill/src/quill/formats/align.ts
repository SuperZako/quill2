// import Parchment from 'parchment';

let _config = {
    scope: Parchment.Scope.BLOCK,
    whitelist: ['right', 'center', 'justify']
};

let AlignAttribute = new Parchment.Attributor('align', 'align', _config);
let AlignClass = new Parchment.ClassAttributor('align', 'ql-align', _config);
let AlignStyle = new Parchment.StyleAttributor('align', 'text-align', _config);

// export { AlignAttribute, AlignClass, AlignStyle };