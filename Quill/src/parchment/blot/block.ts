//import FormatBlot from './abstract/format';
//import * as Registry from '../registry';

namespace Parchment {
    export class BlockBlot extends FormatBlot {
        static blotName = 'block';
        static scope = Scope.BLOCK_BLOT;
        static tagName: string | string[] = 'P';

        static formats(domNode): any {
            let tagName = (<any>query(BlockBlot.blotName)).tagName;
            if (domNode.tagName === tagName) return undefined;
            return super.formats(domNode);
        }

        format(name: string, value: any) {
            if (query(name, Scope.BLOCK) == null) {
                return;
            } else if (name === this.statics.blotName && !value) {
                this.replaceWith(BlockBlot.blotName);
            } else {
                super.format(name, value);
            }
        }

        formatAt(index: number, length: number, name: string, value: any): void {
            if (query(name, Scope.BLOCK) != null) {
                this.format(name, value);
            } else {
                super.formatAt(index, length, name, value);
            }
        }

        insertAt(index: number, value: string, def?: any): void {
            if (def == null || query(value, Scope.INLINE) != null) {
                // Insert text or inline
                super.insertAt(index, value, def);
            } else {
                let after = this.split(index);
                let blot = create(value, def);
                after.parent.insertBefore(blot, after);
            }
        }
    }


    // export default BlockBlot;
}