// import { Formattable, Leaf } from './blot';


///<reference path='./shadow.ts' />
// import ShadowBlot from './shadow';

///<reference path='../../registry.ts' />
// import * as Registry from '../../registry';


class LeafBlot extends ShadowBlot implements Leaf {
    static scope = Registry.Scope.INLINE_BLOT;

    static value(domNode: Node): any {
        return true;
    }

    public constructor(domNode: Node) {
        super(domNode);
    }

    index(node, offset): number {
        if (node !== this.domNode) return -1;
        return Math.min(offset, 1);
    }

    position(index: number, inclusive?: boolean): [Node, number] {
        let offset = [].indexOf.call(this.parent.domNode.childNodes, this.domNode);
        if (index > 0) offset += 1;
        return [this.parent.domNode, offset];
    }

    value(): any {
        return { [this.statics.blotName]: this.statics.value(this.domNode) || true };
    }
}


// export default LeafBlot;
