﻿
///<reference path='../blots/inline.ts' />
// import Inline from '../blots/inline';

class Bold extends Inline {
    static create() {
        return super.create();
    }

    static formats() {
        return true;
    }

    optimize() {
        super.optimize();
        if (this.domNode.tagName !== this.statics.tagName[0]) {
            this.replaceWith(this.statics.blotName);
        }
    }
}
Bold.blotName = 'bold';
Bold.tagName = ['STRONG', 'B'];

// export default Bold;