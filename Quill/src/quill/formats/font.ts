// import Parchment from 'parchment';

let font_config = {
    scope: Parchment.Scope.INLINE,
    whitelist: ['serif', 'monospace']
};

let FontClass = new Parchment.ClassAttributor('font', 'ql-font', font_config);

class FontStyleAttributor extends Parchment.StyleAttributor {
    value(node) {
        return super.value(node).replace(/["']/g, '');
    }
}

let FontStyle = new FontStyleAttributor('font', 'font-family', font_config);

// export { FontStyle, FontClass };