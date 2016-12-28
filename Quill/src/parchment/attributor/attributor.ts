///<reference path='../registry.ts' />
// import * as Registry from '../registry';

namespace Parchment {
    export interface AttributorOptions {
        scope?: Scope;
        whitelist?: string[];
    }

    export class Attributor {
        attrName: string;
        keyName: string;
        scope: Scope;
        whitelist: string[];

        static keys(node: HTMLElement): string[] {
            return [].map.call(node.attributes, function (item) {
                return item.name;
            });
        }

        constructor(attrName: string, keyName: string, options: AttributorOptions = {}) {
            this.attrName = attrName;
            this.keyName = keyName;
            let attributeBit = Scope.TYPE & Scope.ATTRIBUTE;
            if (options.scope != null) {
                // Ignore type bits, force attribute bit
                this.scope = (options.scope & Scope.LEVEL) | attributeBit;
            } else {
                this.scope = Scope.ATTRIBUTE;
            }
            if (options.whitelist != null) this.whitelist = options.whitelist;
        }

        add(node: HTMLElement, value: string): boolean {
            if (!this.canAdd(node, value)) return false;
            node.setAttribute(this.keyName, value);
            return true;
        }

        canAdd(node: HTMLElement, value: string): boolean {
            let match = query(node, Scope.BLOT & (this.scope | Scope.TYPE));
            if (match != null && (this.whitelist == null || this.whitelist.indexOf(value) > -1)) {
                return true;
            }
            return false;
        }

        remove(node: HTMLElement): void {
            node.removeAttribute(this.keyName);
        }

        value(node: HTMLElement): string {
            let value = node.getAttribute(this.keyName);
            return this.canAdd(node, value) ? value : '';
        }
    }
}