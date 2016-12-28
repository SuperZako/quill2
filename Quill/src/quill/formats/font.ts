// import Parchment from 'parchment';

let font_config = {
    scope: /*Parchment*/Registry.Scope.INLINE,
    whitelist: ['serif', 'monospace']
};

let FontClass = new /*Parchment.Attributor.Class*/ClassAttributor('font', 'ql-font', font_config);

class FontStyleAttributor extends /*Parchment.Attributor.Style*/StyleAttributor {
    value(node) {
        return super.value(node).replace(/["']/g, '');
    }
}

let FontStyle = new FontStyleAttributor('font', 'font-family', font_config);

// export { FontStyle, FontClass };