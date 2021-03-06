﻿///<reference path='../blots/embed.ts' />
// import Embed from '../blots/embed';


///<reference path='../core/quill.ts' />
// import Quill from '../core/quill';


class FormulaBlot extends Embed {
    static blotName = 'formula';
    static className = 'ql-formula';
    static tagName = 'SPAN';

    static create(value) {
        let node = <HTMLElement>super.create(value);
        if (typeof value === 'string') {
            window.katex.render(value, node);
            node.setAttribute('data-value', value);
        }
        node.setAttribute('contenteditable', 'false');
        return node;
    }

    static value(domNode) {
        return domNode.getAttribute('data-value');
    }

    index() {
        return 1;
    }
}
//FormulaBlot.blotName = 'formula';
//FormulaBlot.className = 'ql-formula';
//FormulaBlot.tagName = 'SPAN';


function Formula() {
    if (window.katex == null) {
        throw new Error('Formula module requires KaTeX.');
    }
    Quill.register(FormulaBlot, true);
}


// export { FormulaBlot, Formula as default };