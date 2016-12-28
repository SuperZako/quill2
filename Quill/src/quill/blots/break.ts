///<reference path='./embed.ts' />
//import Embed from './embed';


class Break extends Embed {
    static blotName = 'break';
    static tagName = 'BR';

    static value() {
        return undefined;
    }

    insertInto(parent, ref) {
        if (parent.children.length === 0) {
            super.insertInto(parent, ref);
        } else {
            this.remove();
        }
    }

    length() {
        return 0;
    }

    value() {
        return '';
    }
}
//Break.blotName = 'break';
//Break.tagName = 'BR';


//export default Break;