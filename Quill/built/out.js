var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
//import Attributor from './attributor/attributor';
//import { Blot, Formattable } from './blot/abstract/blot';
var Parchment;
(function (Parchment) {
    var ParchmentError = (function (_super) {
        __extends(ParchmentError, _super);
        function ParchmentError(message) {
            var _this;
            message = '[Parchment] ' + message;
            _this = _super.call(this, message) || this;
            _this.message = message;
            _this.name = _this.constructor.name;
            return _this;
        }
        return ParchmentError;
    }(Error));
    Parchment.ParchmentError = ParchmentError;
    var attributes = {};
    var classes = {};
    var tags = {};
    var types = {};
    Parchment.DATA_KEY = '__blot';
    (function (Scope) {
        Scope[Scope["TYPE"] = 3] = "TYPE";
        Scope[Scope["LEVEL"] = 12] = "LEVEL";
        Scope[Scope["ATTRIBUTE"] = 13] = "ATTRIBUTE";
        Scope[Scope["BLOT"] = 14] = "BLOT";
        Scope[Scope["INLINE"] = 7] = "INLINE";
        Scope[Scope["BLOCK"] = 11] = "BLOCK";
        Scope[Scope["BLOCK_BLOT"] = 10] = "BLOCK_BLOT";
        Scope[Scope["INLINE_BLOT"] = 6] = "INLINE_BLOT";
        Scope[Scope["BLOCK_ATTRIBUTE"] = 9] = "BLOCK_ATTRIBUTE";
        Scope[Scope["INLINE_ATTRIBUTE"] = 5] = "INLINE_ATTRIBUTE";
        Scope[Scope["ANY"] = 15] = "ANY";
    })(Parchment.Scope || (Parchment.Scope = {}));
    var Scope = Parchment.Scope;
    ;
    function create(input, value) {
        var match = query(input);
        if (match == null) {
            throw new ParchmentError("Unable to create " + input + " blot");
        }
        var BlotClass = match;
        var node = input instanceof Node ? input : BlotClass.create(value);
        return new BlotClass(node, value);
    }
    Parchment.create = create;
    function find(node, bubble) {
        if (bubble === void 0) { bubble = false; }
        if (node == null)
            return null;
        if (node[Parchment.DATA_KEY] != null)
            return node[Parchment.DATA_KEY].blot;
        if (bubble)
            return find(node.parentNode, bubble);
        return null;
    }
    Parchment.find = find;
    function query(query, scope) {
        if (scope === void 0) { scope = Scope.ANY; }
        var match;
        if (typeof query === 'string') {
            match = types[query] || attributes[query];
        }
        else if (query instanceof Text) {
            match = types['text'];
        }
        else if (typeof query === 'number') {
            if (query & Scope.LEVEL & Scope.BLOCK) {
                match = types['block'];
            }
            else if (query & Scope.LEVEL & Scope.INLINE) {
                match = types['inline'];
            }
        }
        else if (query instanceof HTMLElement) {
            var names = (query.getAttribute('class') || '').split(/\s+/);
            for (var i in names) {
                match = classes[names[i]];
                if (match)
                    break;
            }
            match = match || tags[query.tagName];
        }
        if (match == null)
            return null;
        if ((scope & Scope.LEVEL & match.scope) && (scope & Scope.TYPE & match.scope))
            return match;
        return null;
    }
    Parchment.query = query;
    function register() {
        var Definitions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            Definitions[_i - 0] = arguments[_i];
        }
        if (Definitions.length > 1) {
            return Definitions.map(function (d) {
                return register(d);
            });
        }
        var Definition = Definitions[0];
        if (typeof Definition.blotName !== 'string' && typeof Definition.attrName !== 'string') {
            throw new ParchmentError('Invalid definition');
        }
        else if (Definition.blotName === 'abstract') {
            throw new ParchmentError('Cannot register abstract class');
        }
        types[Definition.blotName || Definition.attrName] = Definition;
        if (typeof Definition.keyName === 'string') {
            attributes[Definition.keyName] = Definition;
        }
        else {
            if (Definition.className != null) {
                classes[Definition.className] = Definition;
            }
            if (Definition.tagName != null) {
                if (Array.isArray(Definition.tagName)) {
                    Definition.tagName = Definition.tagName.map(function (tagName) {
                        return tagName.toUpperCase();
                    });
                }
                else {
                    Definition.tagName = Definition.tagName.toUpperCase();
                }
                var tagNames = Array.isArray(Definition.tagName) ? Definition.tagName : [Definition.tagName];
                tagNames.forEach(function (tag) {
                    if (tags[tag] == null || Definition.className == null) {
                        tags[tag] = Definition;
                    }
                });
            }
        }
        return Definition;
    }
    Parchment.register = register;
})(Parchment || (Parchment = {}));
///<reference path='../registry.ts' />
// import * as Registry from '../registry';
var Parchment;
(function (Parchment) {
    var Attributor = (function () {
        function Attributor(attrName, keyName, options) {
            if (options === void 0) { options = {}; }
            this.attrName = attrName;
            this.keyName = keyName;
            var attributeBit = Parchment.Scope.TYPE & Parchment.Scope.ATTRIBUTE;
            if (options.scope != null) {
                // Ignore type bits, force attribute bit
                this.scope = (options.scope & Parchment.Scope.LEVEL) | attributeBit;
            }
            else {
                this.scope = Parchment.Scope.ATTRIBUTE;
            }
            if (options.whitelist != null)
                this.whitelist = options.whitelist;
        }
        Attributor.keys = function (node) {
            return [].map.call(node.attributes, function (item) {
                return item.name;
            });
        };
        Attributor.prototype.add = function (node, value) {
            if (!this.canAdd(node, value))
                return false;
            node.setAttribute(this.keyName, value);
            return true;
        };
        Attributor.prototype.canAdd = function (node, value) {
            var match = Parchment.query(node, Parchment.Scope.BLOT & (this.scope | Parchment.Scope.TYPE));
            if (match != null && (this.whitelist == null || this.whitelist.indexOf(value) > -1)) {
                return true;
            }
            return false;
        };
        Attributor.prototype.remove = function (node) {
            node.removeAttribute(this.keyName);
        };
        Attributor.prototype.value = function (node) {
            var value = node.getAttribute(this.keyName);
            return this.canAdd(node, value) ? value : '';
        };
        return Attributor;
    }());
    Parchment.Attributor = Attributor;
})(Parchment || (Parchment = {}));
///<reference path='./attributor.ts' />
// import Attributor from './attributor';
var Parchment;
(function (Parchment) {
    function _match(node, prefix) {
        var className = node.getAttribute('class') || '';
        return className.split(/\s+/).filter(function (name) {
            return name.indexOf(prefix + "-") === 0;
        });
    }
    var ClassAttributor = (function (_super) {
        __extends(ClassAttributor, _super);
        function ClassAttributor() {
            return _super.apply(this, arguments) || this;
        }
        ClassAttributor.keys = function (node) {
            return (node.getAttribute('class') || '').split(/\s+/).map(function (name) {
                return name.split('-').slice(0, -1).join('-');
            });
        };
        ClassAttributor.prototype.add = function (node, value) {
            if (!this.canAdd(node, value))
                return false;
            this.remove(node);
            node.classList.add(this.keyName + "-" + value);
            return true;
        };
        ClassAttributor.prototype.remove = function (node) {
            var matches = _match(node, this.keyName);
            matches.forEach(function (name) {
                node.classList.remove(name);
            });
            if (node.classList.length === 0) {
                node.removeAttribute('class');
            }
        };
        ClassAttributor.prototype.value = function (node) {
            var result = _match(node, this.keyName)[0] || '';
            var value = result.slice(this.keyName.length + 1); // +1 for hyphen
            return this.canAdd(node, value) ? value : '';
        };
        return ClassAttributor;
    }(Parchment.Attributor));
    Parchment.ClassAttributor = ClassAttributor;
    // export default ClassAttributor;
})(Parchment || (Parchment = {}));
//import Attributor from './attributor';
//import ClassAttributor from './class';
//import StyleAttributor from './style';
//import { Formattable } from '../blot/abstract/blot';
//import * as Registry from '../registry';
var Parchment;
(function (Parchment) {
    var AttributorStore = (function () {
        function AttributorStore(domNode) {
            this.attributes = {};
            this.domNode = domNode;
            this.build();
        }
        AttributorStore.prototype.attribute = function (attribute, value) {
            if (value) {
                if (attribute.add(this.domNode, value)) {
                    if (attribute.value(this.domNode) != null) {
                        this.attributes[attribute.attrName] = attribute;
                    }
                    else {
                        delete this.attributes[attribute.attrName];
                    }
                }
            }
            else {
                attribute.remove(this.domNode);
                delete this.attributes[attribute.attrName];
            }
        };
        AttributorStore.prototype.build = function () {
            var _this = this;
            this.attributes = {};
            var attributes = Parchment.Attributor.keys(this.domNode);
            var classes = Parchment.ClassAttributor.keys(this.domNode);
            var styles = Parchment.StyleAttributor.keys(this.domNode);
            attributes.concat(classes).concat(styles).forEach(function (name) {
                var attr = Parchment.query(name, Parchment.Scope.ATTRIBUTE);
                if (attr instanceof Parchment.Attributor) {
                    _this.attributes[attr.attrName] = attr;
                }
            });
        };
        AttributorStore.prototype.copy = function (target) {
            var _this = this;
            Object.keys(this.attributes).forEach(function (key) {
                var value = _this.attributes[key].value(_this.domNode);
                target.format(key, value);
            });
        };
        AttributorStore.prototype.move = function (target) {
            var _this = this;
            this.copy(target);
            Object.keys(this.attributes).forEach(function (key) {
                _this.attributes[key].remove(_this.domNode);
            });
            this.attributes = {};
        };
        AttributorStore.prototype.values = function () {
            var _this = this;
            return Object.keys(this.attributes).reduce(function (attributes, name) {
                attributes[name] = _this.attributes[name].value(_this.domNode);
                return attributes;
            }, {});
        };
        return AttributorStore;
    }());
    Parchment.AttributorStore = AttributorStore;
    // export default AttributorStore;
})(Parchment || (Parchment = {}));
///<reference path='./attributor.ts' />
// import Attributor from './attributor';
var Parchment;
(function (Parchment) {
    function camelize(name) {
        var parts = name.split('-');
        var rest = parts.slice(1).map(function (part) {
            return part[0].toUpperCase() + part.slice(1);
        }).join('');
        return parts[0] + rest;
    }
    var StyleAttributor = (function (_super) {
        __extends(StyleAttributor, _super);
        function StyleAttributor() {
            return _super.apply(this, arguments) || this;
        }
        StyleAttributor.keys = function (node) {
            return (node.getAttribute('style') || '').split(';').map(function (value) {
                var arr = value.split(':');
                return arr[0].trim();
            });
        };
        StyleAttributor.prototype.add = function (node, value) {
            if (!this.canAdd(node, value))
                return false;
            node.style[camelize(this.keyName)] = value;
            return true;
        };
        StyleAttributor.prototype.remove = function (node) {
            node.style[camelize(this.keyName)] = '';
            if (!node.getAttribute('style')) {
                node.removeAttribute('style');
            }
        };
        StyleAttributor.prototype.value = function (node) {
            var value = node.style[camelize(this.keyName)];
            return this.canAdd(node, value) ? value : '';
        };
        return StyleAttributor;
    }(Parchment.Attributor));
    Parchment.StyleAttributor = StyleAttributor;
    // export default StyleAttributor;
})(Parchment || (Parchment = {}));
///<reference path='./linked-node.ts' />
// import LinkedNode from './linked-node';
var Parchment;
(function (Parchment) {
    var LinkedList = (function () {
        function LinkedList() {
            this.head = this.tail = undefined;
            this.length = 0;
        }
        LinkedList.prototype.append = function () {
            var nodes = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                nodes[_i - 0] = arguments[_i];
            }
            this.insertBefore(nodes[0], undefined);
            if (nodes.length > 1) {
                this.append.apply(this, nodes.slice(1));
            }
        };
        LinkedList.prototype.contains = function (node) {
            var cur, next = this.iterator();
            while (cur = next()) {
                if (cur === node)
                    return true;
            }
            return false;
        };
        LinkedList.prototype.insertBefore = function (node, refNode) {
            node.next = refNode;
            if (refNode != null) {
                node.prev = refNode.prev;
                if (refNode.prev != null) {
                    refNode.prev.next = node;
                }
                refNode.prev = node;
                if (refNode === this.head) {
                    this.head = node;
                }
            }
            else if (this.tail != null) {
                this.tail.next = node;
                node.prev = this.tail;
                this.tail = node;
            }
            else {
                node.prev = undefined;
                this.head = this.tail = node;
            }
            this.length += 1;
        };
        LinkedList.prototype.offset = function (target) {
            var index = 0, cur = this.head;
            while (cur != null) {
                if (cur === target)
                    return index;
                index += cur.length();
                cur = cur.next;
            }
            return -1;
        };
        LinkedList.prototype.remove = function (node) {
            if (!this.contains(node))
                return;
            if (node.prev != null)
                node.prev.next = node.next;
            if (node.next != null)
                node.next.prev = node.prev;
            if (node === this.head)
                this.head = node.next;
            if (node === this.tail)
                this.tail = node.prev;
            this.length -= 1;
        };
        LinkedList.prototype.iterator = function (curNode) {
            if (curNode === void 0) { curNode = this.head; }
            // TODO use yield when we can
            return function () {
                var ret = curNode;
                if (curNode != null)
                    curNode = curNode.next;
                return ret;
            };
        };
        LinkedList.prototype.find = function (index, inclusive) {
            if (inclusive === void 0) { inclusive = false; }
            var cur, next = this.iterator();
            while (cur = next()) {
                var length_1 = cur.length();
                if (index < length_1 || (inclusive && index === length_1 && (cur.next == null || cur.next.length() !== 0))) {
                    return [cur, index];
                }
                index -= length_1;
            }
            return [null, 0];
        };
        LinkedList.prototype.forEach = function (callback) {
            var cur, next = this.iterator();
            while (cur = next()) {
                callback(cur);
            }
        };
        LinkedList.prototype.forEachAt = function (index, length, callback) {
            if (length <= 0)
                return;
            var _a = this.find(index), startNode = _a[0], offset = _a[1];
            var cur, curIndex = index - offset, next = this.iterator(startNode);
            while ((cur = next()) && curIndex < index + length) {
                var curLength = cur.length();
                if (index > curIndex) {
                    callback(cur, index - curIndex, Math.min(length, curIndex + curLength - index));
                }
                else {
                    callback(cur, 0, Math.min(curLength, index + length - curIndex));
                }
                curIndex += curLength;
            }
        };
        LinkedList.prototype.map = function (callback) {
            return this.reduce(function (memo, cur) {
                memo.push(callback(cur));
                return memo;
            }, []);
        };
        LinkedList.prototype.reduce = function (callback, memo) {
            var cur, next = this.iterator();
            while (cur = next()) {
                memo = callback(memo, cur);
            }
            return memo;
        };
        return LinkedList;
    }());
    Parchment.LinkedList = LinkedList;
})(Parchment || (Parchment = {}));
//import LinkedList from '../../collection/linked-list';
///<reference path='../../collection/linked-list.ts' />
// import LinkedNode from '../../collection/linked-node';
///<reference path='./blot.ts' />
// import { Blot, Parent, Formattable } from './blot';
///<reference path='../../registry.ts' />
// import * as Registry from '../../registry';
var Parchment;
(function (Parchment) {
    var ShadowBlot = (function () {
        function ShadowBlot(domNode) {
            this.domNode = domNode;
            this.attach();
        }
        Object.defineProperty(ShadowBlot.prototype, "statics", {
            // Hack for accessing inherited static methods
            get: function () {
                return this.constructor;
            },
            enumerable: true,
            configurable: true
        });
        ShadowBlot.create = function (value) {
            if (this.tagName == null) {
                throw new Parchment.ParchmentError('Blot definition missing tagName');
            }
            var node;
            if (Array.isArray(this.tagName)) {
                if (typeof value === 'string') {
                    value = value.toUpperCase();
                    if (parseInt(value).toString() === value) {
                        value = parseInt(value);
                    }
                }
                if (typeof value === 'number') {
                    node = document.createElement(this.tagName[value - 1]);
                }
                else if (this.tagName.indexOf(value) > -1) {
                    node = document.createElement(value);
                }
                else {
                    node = document.createElement(this.tagName[0]);
                }
            }
            else {
                node = document.createElement(this.tagName);
            }
            if (this.className) {
                node.classList.add(this.className);
            }
            return node;
        };
        ShadowBlot.prototype.attach = function () {
            this.domNode[Parchment.DATA_KEY] = { blot: this };
        };
        ShadowBlot.prototype.clone = function () {
            var domNode = this.domNode.cloneNode();
            return Parchment.create(domNode);
        };
        ShadowBlot.prototype.detach = function () {
            if (this.parent != null)
                this.parent.removeChild(this);
            delete this.domNode[Parchment.DATA_KEY];
        };
        ShadowBlot.prototype.deleteAt = function (index, length) {
            var blot = this.isolate(index, length);
            blot.remove();
        };
        ShadowBlot.prototype.formatAt = function (index, length, name, value) {
            var blot = this.isolate(index, length);
            if (Parchment.query(name, Parchment.Scope.BLOT) != null && value) {
                blot.wrap(name, value);
            }
            else if (Parchment.query(name, Parchment.Scope.ATTRIBUTE) != null) {
                var parent_1 = Parchment.create(this.statics.scope);
                blot.wrap(parent_1);
                parent_1.format(name, value);
            }
        };
        ShadowBlot.prototype.insertAt = function (index, value, def) {
            var blot = (def == null) ? Parchment.create('text', value) : Parchment.create(value, def);
            var ref = this.split(index);
            this.parent.insertBefore(blot, ref);
        };
        ShadowBlot.prototype.insertInto = function (parentBlot, refBlot) {
            if (this.parent != null) {
                this.parent.children.remove(this);
            }
            parentBlot.children.insertBefore(this, refBlot);
            if (refBlot != null) {
                var refDomNode = refBlot.domNode;
            }
            if (this.next == null || this.domNode.nextSibling != refDomNode) {
                parentBlot.domNode.insertBefore(this.domNode, (typeof refDomNode !== 'undefined') ? refDomNode : null);
            }
            this.parent = parentBlot;
        };
        ShadowBlot.prototype.isolate = function (index, length) {
            var target = this.split(index);
            target.split(length);
            return target;
        };
        ShadowBlot.prototype.length = function () {
            return 1;
        };
        ;
        ShadowBlot.prototype.offset = function (root) {
            if (root === void 0) { root = this.parent; }
            if (this.parent == null || this == root)
                return 0;
            return this.parent.children.offset(this) + this.parent.offset(root);
        };
        ShadowBlot.prototype.optimize = function () {
            // TODO clean up once we use WeakMap
            if (this.domNode[Parchment.DATA_KEY] != null) {
                delete this.domNode[Parchment.DATA_KEY].mutations;
            }
        };
        ShadowBlot.prototype.remove = function () {
            if (this.domNode.parentNode != null) {
                this.domNode.parentNode.removeChild(this.domNode);
            }
            this.detach();
        };
        ShadowBlot.prototype.replace = function (target) {
            if (target.parent == null)
                return;
            target.parent.insertBefore(this, target.next);
            target.remove();
        };
        ShadowBlot.prototype.replaceWith = function (name, value) {
            var replacement = typeof name === 'string' ? Parchment.create(name, value) : name;
            replacement.replace(this);
            return replacement;
        };
        ShadowBlot.prototype.split = function (index, force) {
            return index === 0 ? this : this.next;
        };
        ShadowBlot.prototype.update = function (mutations) {
            if (mutations === void 0) { mutations = []; }
            // Nothing to do by default
        };
        ShadowBlot.prototype.wrap = function (name, value) {
            var wrapper = typeof name === 'string' ? Parchment.create(name, value) : name;
            if (this.parent != null) {
                this.parent.insertBefore(wrapper, this.next);
            }
            wrapper.appendChild(this);
            return wrapper;
        };
        return ShadowBlot;
    }());
    ShadowBlot.blotName = 'abstract';
    Parchment.ShadowBlot = ShadowBlot;
    // export default ShadowBlot;
})(Parchment || (Parchment = {}));
///<reference path='./blot.ts' />
//import { Blot, Parent, Leaf } from './blot';
///<reference path='../../collection/linked-list.ts' />
//import LinkedList from '../../collection/linked-list';
///<reference path='./shadow.ts' />
//import ShadowBlot from './shadow';
///<reference path='../../registry.ts' />
//import * as Registry from '../../registry';
var Parchment;
(function (Parchment) {
    var ContainerBlot = (function (_super) {
        __extends(ContainerBlot, _super);
        function ContainerBlot() {
            return _super.apply(this, arguments) || this;
        }
        ContainerBlot.prototype.appendChild = function (other) {
            this.insertBefore(other);
        };
        ContainerBlot.prototype.attach = function () {
            var _this = this;
            _super.prototype.attach.call(this);
            this.children = new Parchment.LinkedList();
            // Need to be reversed for if DOM nodes already in order
            [].slice.call(this.domNode.childNodes).reverse().forEach(function (node) {
                try {
                    var child = makeBlot(node);
                    _this.insertBefore(child, _this.children.head);
                }
                catch (err) {
                    if (err instanceof Parchment.ParchmentError)
                        return;
                    else
                        throw err;
                }
            });
        };
        ContainerBlot.prototype.deleteAt = function (index, length) {
            if (index === 0 && length === this.length()) {
                return this.remove();
            }
            this.children.forEachAt(index, length, function (child, offset, length) {
                child.deleteAt(offset, length);
            });
        };
        ContainerBlot.prototype.descendant = function (criteria, index) {
            var _a = this.children.find(index), child = _a[0], offset = _a[1];
            if ((criteria.blotName == null && criteria(child)) ||
                (criteria.blotName != null && child instanceof criteria)) {
                return [child, offset];
            }
            else if (child instanceof ContainerBlot) {
                return child.descendant(criteria, offset);
            }
            else {
                return [null, -1];
            }
        };
        ContainerBlot.prototype.descendants = function (criteria, index, length) {
            if (index === void 0) { index = 0; }
            if (length === void 0) { length = Number.MAX_VALUE; }
            var descendants = [], lengthLeft = length;
            this.children.forEachAt(index, length, function (child, index, length) {
                if ((criteria.blotName == null && criteria(child)) ||
                    (criteria.blotName != null && child instanceof criteria)) {
                    descendants.push(child);
                }
                if (child instanceof ContainerBlot) {
                    descendants = descendants.concat(child.descendants(criteria, index, lengthLeft));
                }
                lengthLeft -= length;
            });
            return descendants;
        };
        ContainerBlot.prototype.detach = function () {
            this.children.forEach(function (child) {
                child.detach();
            });
            _super.prototype.detach.call(this);
        };
        ContainerBlot.prototype.formatAt = function (index, length, name, value) {
            this.children.forEachAt(index, length, function (child, offset, length) {
                child.formatAt(offset, length, name, value);
            });
        };
        ContainerBlot.prototype.insertAt = function (index, value, def) {
            var _a = this.children.find(index), child = _a[0], offset = _a[1];
            if (child) {
                child.insertAt(offset, value, def);
            }
            else {
                var blot = (def == null) ? Parchment.create('text', value) : Parchment.create(value, def);
                this.appendChild(blot);
            }
        };
        ContainerBlot.prototype.insertBefore = function (childBlot, refBlot) {
            if (this.statics.allowedChildren != null && !this.statics.allowedChildren.some(function (child) {
                return childBlot instanceof child;
            })) {
                throw new Parchment.ParchmentError("Cannot insert " + childBlot.statics.blotName + " into " + this.statics.blotName);
            }
            childBlot.insertInto(this, refBlot);
        };
        ContainerBlot.prototype.length = function () {
            return this.children.reduce(function (memo, child) {
                return memo + child.length();
            }, 0);
        };
        ContainerBlot.prototype.moveChildren = function (targetParent, refNode) {
            this.children.forEach(function (child) {
                targetParent.insertBefore(child, refNode);
            });
        };
        ContainerBlot.prototype.optimize = function () {
            _super.prototype.optimize.call(this);
            if (this.children.length === 0) {
                if (this.statics.defaultChild != null) {
                    var child = Parchment.create(this.statics.defaultChild);
                    this.appendChild(child);
                    child.optimize();
                }
                else {
                    this.remove();
                }
            }
        };
        ContainerBlot.prototype.path = function (index, inclusive) {
            if (inclusive === void 0) { inclusive = false; }
            var _a = this.children.find(index, inclusive), child = _a[0], offset = _a[1];
            var position = [[this, index]];
            if (child instanceof ContainerBlot) {
                return position.concat(child.path(offset, inclusive));
            }
            else if (child != null) {
                position.push([child, offset]);
            }
            return position;
        };
        ContainerBlot.prototype.removeChild = function (child) {
            this.children.remove(child);
        };
        ContainerBlot.prototype.replace = function (target) {
            if (target instanceof ContainerBlot) {
                target.moveChildren(this);
            }
            _super.prototype.replace.call(this, target);
        };
        ContainerBlot.prototype.split = function (index, force) {
            if (force === void 0) { force = false; }
            if (!force) {
                if (index === 0)
                    return this;
                if (index === this.length())
                    return this.next;
            }
            var after = this.clone();
            this.parent.insertBefore(after, this.next);
            this.children.forEachAt(index, this.length(), function (child, offset, length) {
                child = child.split(offset, force);
                after.appendChild(child);
            });
            return after;
        };
        ContainerBlot.prototype.unwrap = function () {
            this.moveChildren(this.parent, this.next);
            this.remove();
        };
        ContainerBlot.prototype.update = function (mutations) {
            var _this = this;
            var addedNodes = [], removedNodes = [];
            mutations.forEach(function (mutation) {
                if (mutation.target === _this.domNode && mutation.type === 'childList') {
                    addedNodes.push.apply(addedNodes, mutation.addedNodes);
                    removedNodes.push.apply(removedNodes, mutation.removedNodes);
                }
            });
            removedNodes.forEach(function (node) {
                if (node.parentNode != null &&
                    (document.body.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY)) {
                    // Node has not actually been removed
                    return;
                }
                var blot = Parchment.find(node);
                if (blot == null)
                    return;
                if (blot.domNode.parentNode == null || blot.domNode.parentNode === _this.domNode) {
                    blot.detach();
                }
            });
            addedNodes.filter(function (node) {
                return node.parentNode == _this.domNode;
            }).sort(function (a, b) {
                if (a === b)
                    return 0;
                if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) {
                    return 1;
                }
                return -1;
            }).forEach(function (node) {
                var refBlot = null;
                if (node.nextSibling != null) {
                    refBlot = Parchment.find(node.nextSibling);
                }
                var blot = makeBlot(node);
                if (blot.next != refBlot || blot.next == null) {
                    if (blot.parent != null) {
                        blot.parent.removeChild(_this);
                    }
                    _this.insertBefore(blot, refBlot);
                }
            });
        };
        return ContainerBlot;
    }(Parchment.ShadowBlot));
    Parchment.ContainerBlot = ContainerBlot;
    function makeBlot(node) {
        var blot = Parchment.find(node);
        if (blot == null) {
            try {
                blot = Parchment.create(node);
            }
            catch (e) {
                blot = Parchment.create(Parchment.Scope.INLINE);
                [].slice.call(node.childNodes).forEach(function (child) {
                    blot.domNode.appendChild(child);
                });
                node.parentNode.replaceChild(blot.domNode, node);
                blot.attach();
            }
        }
        return blot;
    }
    // export default ContainerBlot;
})(Parchment || (Parchment = {}));
//import Attributor from '../../attributor/attributor';
//import AttributorStore from '../../attributor/store';
//import { Blot, Parent, Formattable } from './blot';
//import ContainerBlot from './container';
//import ShadowBlot from './shadow';
//import * as Registry from '../../registry';
var Parchment;
(function (Parchment) {
    var FormatBlot = (function (_super) {
        __extends(FormatBlot, _super);
        function FormatBlot() {
            return _super.apply(this, arguments) || this;
        }
        FormatBlot.formats = function (domNode) {
            if (typeof this.tagName === 'string') {
                return true;
            }
            else if (Array.isArray(this.tagName)) {
                return domNode.tagName.toLowerCase();
            }
            return undefined;
        };
        FormatBlot.prototype.attach = function () {
            _super.prototype.attach.call(this);
            this.attributes = new Parchment.AttributorStore(this.domNode);
        };
        FormatBlot.prototype.format = function (name, value) {
            var format = Parchment.query(name);
            if (format instanceof Parchment.Attributor) {
                this.attributes.attribute(format, value);
            }
            else if (value) {
                if (format != null && (name !== this.statics.blotName || this.formats()[name] !== value)) {
                    this.replaceWith(name, value);
                }
            }
        };
        FormatBlot.prototype.formats = function () {
            var formats = this.attributes.values();
            var format = this.statics.formats(this.domNode);
            if (format != null) {
                formats[this.statics.blotName] = format;
            }
            return formats;
        };
        FormatBlot.prototype.replaceWith = function (name, value) {
            var replacement = _super.prototype.replaceWith.call(this, name, value);
            this.attributes.copy(replacement);
            return replacement;
        };
        FormatBlot.prototype.update = function (mutations) {
            var _this = this;
            _super.prototype.update.call(this, mutations);
            if (mutations.some(function (mutation) {
                return mutation.target === _this.domNode && mutation.type === 'attributes';
            })) {
                this.attributes.build();
            }
        };
        FormatBlot.prototype.wrap = function (name, value) {
            var wrapper = _super.prototype.wrap.call(this, name, value);
            if (wrapper instanceof FormatBlot && wrapper.statics.scope === this.statics.scope) {
                this.attributes.move(wrapper);
            }
            return wrapper;
        };
        return FormatBlot;
    }(Parchment.ContainerBlot));
    Parchment.FormatBlot = FormatBlot;
    // export default FormatBlot;
})(Parchment || (Parchment = {}));
// import { Formattable, Leaf } from './blot';
///<reference path='./shadow.ts' />
// import ShadowBlot from './shadow';
///<reference path='../../registry.ts' />
// import * as Registry from '../../registry';
var Parchment;
(function (Parchment) {
    var LeafBlot = (function (_super) {
        __extends(LeafBlot, _super);
        function LeafBlot(domNode) {
            return _super.call(this, domNode) || this;
        }
        LeafBlot.value = function (domNode) {
            return true;
        };
        LeafBlot.prototype.index = function (node, offset) {
            if (node !== this.domNode)
                return -1;
            return Math.min(offset, 1);
        };
        LeafBlot.prototype.position = function (index, inclusive) {
            var offset = [].indexOf.call(this.parent.domNode.childNodes, this.domNode);
            if (index > 0)
                offset += 1;
            return [this.parent.domNode, offset];
        };
        LeafBlot.prototype.value = function () {
            return _a = {}, _a[this.statics.blotName] = this.statics.value(this.domNode) || true, _a;
            var _a;
        };
        return LeafBlot;
    }(Parchment.ShadowBlot));
    LeafBlot.scope = Parchment.Scope.INLINE_BLOT;
    Parchment.LeafBlot = LeafBlot;
    // export default LeafBlot;
})(Parchment || (Parchment = {}));
//import FormatBlot from './abstract/format';
//import * as Registry from '../registry';
var Parchment;
(function (Parchment) {
    var BlockBlot = (function (_super) {
        __extends(BlockBlot, _super);
        function BlockBlot() {
            return _super.apply(this, arguments) || this;
        }
        BlockBlot.formats = function (domNode) {
            var tagName = Parchment.query(BlockBlot.blotName).tagName;
            if (domNode.tagName === tagName)
                return undefined;
            return _super.formats.call(this, domNode);
        };
        BlockBlot.prototype.format = function (name, value) {
            if (Parchment.query(name, Parchment.Scope.BLOCK) == null) {
                return;
            }
            else if (name === this.statics.blotName && !value) {
                this.replaceWith(BlockBlot.blotName);
            }
            else {
                _super.prototype.format.call(this, name, value);
            }
        };
        BlockBlot.prototype.formatAt = function (index, length, name, value) {
            if (Parchment.query(name, Parchment.Scope.BLOCK) != null) {
                this.format(name, value);
            }
            else {
                _super.prototype.formatAt.call(this, index, length, name, value);
            }
        };
        BlockBlot.prototype.insertAt = function (index, value, def) {
            if (def == null || Parchment.query(value, Parchment.Scope.INLINE) != null) {
                // Insert text or inline
                _super.prototype.insertAt.call(this, index, value, def);
            }
            else {
                var after = this.split(index);
                var blot = Parchment.create(value, def);
                after.parent.insertBefore(blot, after);
            }
        };
        return BlockBlot;
    }(Parchment.FormatBlot));
    BlockBlot.blotName = 'block';
    BlockBlot.scope = Parchment.Scope.BLOCK_BLOT;
    BlockBlot.tagName = ['P'];
    Parchment.BlockBlot = BlockBlot;
    // export default BlockBlot;
})(Parchment || (Parchment = {}));
// import { Formattable } from './abstract/blot';
///<reference path='./abstract/leaf.ts' />
// import LeafBlot from './abstract/leaf';
var Parchment;
(function (Parchment) {
    var EmbedBlot = (function (_super) {
        __extends(EmbedBlot, _super);
        function EmbedBlot() {
            return _super.apply(this, arguments) || this;
        }
        EmbedBlot.formats = function (domNode) {
            return undefined;
        };
        EmbedBlot.prototype.format = function (name, value) {
            // super.formatAt wraps, which is what we want in general,
            // but this allows subclasses to overwrite for formats
            // that just apply to particular embeds
            _super.prototype.formatAt.call(this, 0, this.length(), name, value);
        };
        EmbedBlot.prototype.formatAt = function (index, length, name, value) {
            if (index === 0 && length === this.length()) {
                this.format(name, value);
            }
            else {
                _super.prototype.formatAt.call(this, index, length, name, value);
            }
        };
        EmbedBlot.prototype.formats = function () {
            return this.statics.formats(this.domNode);
        };
        return EmbedBlot;
    }(Parchment.LeafBlot));
    Parchment.EmbedBlot = EmbedBlot;
    // export default EmbedBlot;
})(Parchment || (Parchment = {}));
//import FormatBlot from './abstract/format';
//import LeafBlot from './abstract/leaf';
//import ShadowBlot from './abstract/shadow';
//import * as Registry from '../registry';
var Parchment;
(function (Parchment) {
    // Shallow object comparison
    function isEqual(obj1, obj2) {
        if (Object.keys(obj1).length !== Object.keys(obj2).length)
            return false;
        for (var prop in obj1) {
            if (obj1[prop] !== obj2[prop])
                return false;
        }
        return true;
    }
    var InlineBlot = (function (_super) {
        __extends(InlineBlot, _super);
        function InlineBlot() {
            return _super.apply(this, arguments) || this;
        }
        InlineBlot.formats = function (domNode) {
            if (domNode.tagName === InlineBlot.tagName)
                return undefined;
            return _super.formats.call(this, domNode);
        };
        InlineBlot.prototype.format = function (name, value) {
            var _this = this;
            if (name === this.statics.blotName && !value) {
                this.children.forEach(function (child) {
                    if (!(child instanceof Parchment.FormatBlot)) {
                        child = child.wrap(InlineBlot.blotName, true);
                    }
                    _this.attributes.copy(child);
                });
                this.unwrap();
            }
            else {
                _super.prototype.format.call(this, name, value);
            }
        };
        InlineBlot.prototype.formatAt = function (index, length, name, value) {
            if (this.formats()[name] != null || Parchment.query(name, Parchment.Scope.ATTRIBUTE)) {
                var blot = this.isolate(index, length);
                blot.format(name, value);
            }
            else {
                _super.prototype.formatAt.call(this, index, length, name, value);
            }
        };
        InlineBlot.prototype.optimize = function () {
            _super.prototype.optimize.call(this);
            var formats = this.formats();
            if (Object.keys(formats).length === 0) {
                return this.unwrap(); // unformatted span
            }
            var next = this.next;
            if (next instanceof InlineBlot && next.prev === this && isEqual(formats, next.formats())) {
                next.moveChildren(this);
                next.remove();
            }
        };
        return InlineBlot;
    }(Parchment.FormatBlot));
    InlineBlot.blotName = 'inline';
    InlineBlot.scope = Parchment.Scope.INLINE_BLOT;
    InlineBlot.tagName = ['SPAN'];
    Parchment.InlineBlot = InlineBlot;
    // export default InlineBlot;
})(Parchment || (Parchment = {}));
// import { Blot } from './abstract/blot';
// import ContainerBlot from './abstract/container';
// import LinkedList from '../collection/linked-list';
// import * as Registry from '../registry';
var Parchment;
(function (Parchment) {
    var OBSERVER_CONFIG = {
        attributes: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true
    };
    var MAX_OPTIMIZE_ITERATIONS = 100;
    var ScrollBlot = (function (_super) {
        __extends(ScrollBlot, _super);
        function ScrollBlot(node) {
            var _this = _super.call(this, node) || this;
            _this.parent = null;
            _this.observer = new MutationObserver(function (mutations) {
                _this.update(mutations);
            });
            _this.observer.observe(_this.domNode, OBSERVER_CONFIG);
            return _this;
        }
        ScrollBlot.prototype.detach = function () {
            _super.prototype.detach.call(this);
            this.observer.disconnect();
        };
        ScrollBlot.prototype.deleteAt = function (index, length) {
            this.update();
            if (index === 0 && length === this.length()) {
                this.children.forEach(function (child) {
                    child.remove();
                });
            }
            else {
                _super.prototype.deleteAt.call(this, index, length);
            }
        };
        ScrollBlot.prototype.formatAt = function (index, length, name, value) {
            this.update();
            _super.prototype.formatAt.call(this, index, length, name, value);
        };
        ScrollBlot.prototype.insertAt = function (index, value, def) {
            this.update();
            _super.prototype.insertAt.call(this, index, value, def);
        };
        ScrollBlot.prototype.optimize = function (mutations) {
            var _this = this;
            if (mutations === void 0) { mutations = []; }
            _super.prototype.optimize.call(this);
            // We must modify mutations directly, cannot make copy and then modify
            var records = [].slice.call(this.observer.takeRecords());
            // Array.push currently seems to be implemented by a non-tail recursive function
            // so we cannot just mutations.push.apply(mutations, this.observer.takeRecords());
            while (records.length > 0)
                mutations.push(records.pop());
            // TODO use WeakMap
            var mark = function (blot, markParent) {
                if (markParent === void 0) { markParent = true; }
                if (blot == null || blot === _this)
                    return;
                if (blot.domNode.parentNode == null)
                    return;
                if (blot.domNode[Parchment.DATA_KEY].mutations == null) {
                    blot.domNode[Parchment.DATA_KEY].mutations = [];
                }
                if (markParent)
                    mark(blot.parent);
            };
            var optimize = function (blot) {
                if (blot.domNode[Parchment.DATA_KEY] == null || blot.domNode[Parchment.DATA_KEY].mutations == null) {
                    return;
                }
                if (blot instanceof Parchment.ContainerBlot) {
                    blot.children.forEach(optimize);
                }
                blot.optimize();
            };
            var remaining = mutations;
            for (var i = 0; remaining.length > 0; i += 1) {
                if (i >= MAX_OPTIMIZE_ITERATIONS) {
                    throw new Error('[Parchment] Maximum optimize iterations reached');
                }
                remaining.forEach(function (mutation) {
                    var blot = Parchment.find(mutation.target, true);
                    if (blot == null)
                        return;
                    if (blot.domNode === mutation.target) {
                        if (mutation.type === 'childList') {
                            mark(Parchment.find(mutation.previousSibling, false));
                            [].forEach.call(mutation.addedNodes, function (node) {
                                var child = Parchment.find(node, false);
                                mark(child, false);
                                if (child instanceof Parchment.ContainerBlot) {
                                    child.children.forEach(function (grandChild) {
                                        mark(grandChild, false);
                                    });
                                }
                            });
                        }
                        else if (mutation.type === 'attributes') {
                            mark(blot.prev);
                        }
                    }
                    mark(blot);
                });
                this.children.forEach(optimize);
                remaining = [].slice.call(this.observer.takeRecords());
                records = remaining.slice();
                while (records.length > 0)
                    mutations.push(records.pop());
            }
        };
        ScrollBlot.prototype.update = function (mutations) {
            var _this = this;
            mutations = mutations || this.observer.takeRecords();
            // TODO use WeakMap
            mutations.map(function (mutation) {
                var blot = Parchment.find(mutation.target, true);
                if (blot == null)
                    return;
                if (blot.domNode[Parchment.DATA_KEY].mutations == null) {
                    blot.domNode[Parchment.DATA_KEY].mutations = [mutation];
                    return blot;
                }
                else {
                    blot.domNode[Parchment.DATA_KEY].mutations.push(mutation);
                    return null;
                }
            }).forEach(function (blot) {
                if (blot == null || blot === _this || blot.domNode[Parchment.DATA_KEY] == null)
                    return;
                blot.update(blot.domNode[Parchment.DATA_KEY].mutations || []);
            });
            if (this.domNode[Parchment.DATA_KEY].mutations != null) {
                _super.prototype.update.call(this, this.domNode[Parchment.DATA_KEY].mutations);
            }
            this.optimize(mutations);
        };
        return ScrollBlot;
    }(Parchment.ContainerBlot));
    ScrollBlot.blotName = 'scroll';
    ScrollBlot.defaultChild = 'block';
    ScrollBlot.scope = Parchment.Scope.BLOCK_BLOT;
    ScrollBlot.tagName = 'DIV';
    Parchment.ScrollBlot = ScrollBlot;
    // export default ScrollBlot;
})(Parchment || (Parchment = {}));
//import { Blot, Leaf } from './abstract/blot';
//import LeafBlot from './abstract/leaf';
//import * as Registry from '../registry';
var Parchment;
(function (Parchment) {
    var TextBlot = (function (_super) {
        __extends(TextBlot, _super);
        function TextBlot(node) {
            var _this = _super.call(this, node) || this;
            _this.text = _this.statics.value(_this.domNode);
            return _this;
        }
        TextBlot.create = function (value) {
            return document.createTextNode(value);
        };
        TextBlot.value = function (domNode) {
            return domNode.data;
        };
        TextBlot.prototype.deleteAt = function (index, length) {
            this.domNode.data = this.text = this.text.slice(0, index) + this.text.slice(index + length);
        };
        TextBlot.prototype.index = function (node, offset) {
            if (this.domNode === node) {
                return offset;
            }
            return -1;
        };
        TextBlot.prototype.insertAt = function (index, value, def) {
            if (def == null) {
                this.text = this.text.slice(0, index) + value + this.text.slice(index);
                this.domNode.data = this.text;
            }
            else {
                _super.prototype.insertAt.call(this, index, value, def);
            }
        };
        TextBlot.prototype.length = function () {
            return this.text.length;
        };
        TextBlot.prototype.optimize = function () {
            _super.prototype.optimize.call(this);
            this.text = TextBlot.value(this.domNode);
            if (this.text.length === 0) {
                this.remove();
            }
            else if (this.next instanceof TextBlot && this.next.prev === this) {
                this.insertAt(this.length(), this.next.value());
                this.next.remove();
            }
        };
        TextBlot.prototype.position = function (index, inclusive) {
            if (inclusive === void 0) { inclusive = false; }
            return [this.domNode, index];
        };
        TextBlot.prototype.split = function (index, force) {
            if (force === void 0) { force = false; }
            if (!force) {
                if (index === 0)
                    return this;
                if (index === this.length())
                    return this.next;
            }
            var after = Parchment.create(this.domNode.splitText(index));
            this.parent.insertBefore(after, this.next);
            this.text = this.statics.value(this.domNode);
            return after;
        };
        TextBlot.prototype.update = function (mutations) {
            var _this = this;
            if (mutations.some(function (mutation) {
                return mutation.type === 'characterData' && mutation.target === _this.domNode;
            })) {
                this.text = TextBlot.value(this.domNode);
            }
        };
        TextBlot.prototype.value = function () {
            return this.text;
        };
        return TextBlot;
    }(Parchment.LeafBlot));
    TextBlot.blotName = 'text';
    TextBlot.scope = Parchment.Scope.INLINE_BLOT;
    Parchment.TextBlot = TextBlot;
    // export default TextBlot;
})(Parchment || (Parchment = {}));
//import { Blot } from './blot/abstract/blot';
//import ContainerBlot from './blot/abstract/container';
//import FormatBlot from './blot/abstract/format';
//import LeafBlot from './blot/abstract/leaf';
//import ScrollBlot from './blot/scroll';
//import InlineBlot from './blot/inline';
//import BlockBlot from './blot/block';
//import EmbedBlot from './blot/embed';
//import TextBlot from './blot/text';
//import Attributor from './attributor/attributor';
//import ClassAttributor from './attributor/class';
//import StyleAttributor from './attributor/style';
//import AttributorStore from './attributor/store';
//import * as Registry from './registry';
//let Parchment = {
//  Scope: Registry.Scope,
//  create: Registry.create,
//  find: Registry.find,
//  query: Registry.query,
//  register: Registry.register,
//  Container: ContainerBlot,
//  Format: FormatBlot,
//  Leaf: LeafBlot,
//  Embed: EmbedBlot,
//  Scroll: ScrollBlot,
//  Block: BlockBlot,
//  Inline: InlineBlot,
//  Text: TextBlot,
//  Attributor: {
//    Attribute: Attributor,
//    Class: ClassAttributor,
//    Style: StyleAttributor,
//    Store: AttributorStore
//  }
//};
//export default Parchment;
var alignCenter = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=15 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=14 x2=4 y1=14 y2=14></line> <line class=ql-stroke x1=12 x2=6 y1=4 y2=4></line> </svg>";
var alignJustify = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=15 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=15 x2=3 y1=14 y2=14></line> <line class=ql-stroke x1=15 x2=3 y1=4 y2=4></line> </svg>";
var alignLeft = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=3 x2=15 y1=9 y2=9></line> <line class=ql-stroke x1=3 x2=13 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=9 y1=4 y2=4></line> </svg>";
var alignRight = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=15 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=15 x2=5 y1=14 y2=14></line> <line class=ql-stroke x1=15 x2=9 y1=4 y2=4></line> </svg>";
var background = "<svg viewbox=\"0 0 18 18\"> <g class=\"ql-fill ql-color-label\"> <polygon points=\"6 6.868 6 6 5 6 5 7 5.942 7 6 6.868\"></polygon> <rect height=1 width=1 x=4 y=4></rect> <polygon points=\"6.817 5 6 5 6 6 6.38 6 6.817 5\"></polygon> <rect height=1 width=1 x=2 y=6></rect> <rect height=1 width=1 x=3 y=5></rect> <rect height=1 width=1 x=4 y=7></rect> <polygon points=\"4 11.439 4 11 3 11 3 12 3.755 12 4 11.439\"></polygon> <rect height=1 width=1 x=2 y=12></rect> <rect height=1 width=1 x=2 y=9></rect> <rect height=1 width=1 x=2 y=15></rect> <polygon points=\"4.63 10 4 10 4 11 4.192 11 4.63 10\"></polygon> <rect height=1 width=1 x=3 y=8></rect> <path d=M10.832,4.2L11,4.582V4H10.708A1.948,1.948,0,0,1,10.832,4.2Z></path> <path d=M7,4.582L7.168,4.2A1.929,1.929,0,0,1,7.292,4H7V4.582Z></path> <path d=M8,13H7.683l-0.351.8a1.933,1.933,0,0,1-.124.2H8V13Z></path> <rect height=1 width=1 x=12 y=2></rect> <rect height=1 width=1 x=11 y=3></rect> <path d=M9,3H8V3.282A1.985,1.985,0,0,1,9,3Z></path> <rect height=1 width=1 x=2 y=3></rect> <rect height=1 width=1 x=6 y=2></rect> <rect height=1 width=1 x=3 y=2></rect> <rect height=1 width=1 x=5 y=3></rect> <rect height=1 width=1 x=9 y=2></rect> <rect height=1 width=1 x=15 y=14></rect> <polygon points=\"13.447 10.174 13.469 10.225 13.472 10.232 13.808 11 14 11 14 10 13.37 10 13.447 10.174\"></polygon> <rect height=1 width=1 x=13 y=7></rect> <rect height=1 width=1 x=15 y=5></rect> <rect height=1 width=1 x=14 y=6></rect> <rect height=1 width=1 x=15 y=8></rect> <rect height=1 width=1 x=14 y=9></rect> <path d=M3.775,14H3v1H4V14.314A1.97,1.97,0,0,1,3.775,14Z></path> <rect height=1 width=1 x=14 y=3></rect> <polygon points=\"12 6.868 12 6 11.62 6 12 6.868\"></polygon> <rect height=1 width=1 x=15 y=2></rect> <rect height=1 width=1 x=12 y=5></rect> <rect height=1 width=1 x=13 y=4></rect> <polygon points=\"12.933 9 13 9 13 8 12.495 8 12.933 9\"></polygon> <rect height=1 width=1 x=9 y=14></rect> <rect height=1 width=1 x=8 y=15></rect> <path d=M6,14.926V15H7V14.316A1.993,1.993,0,0,1,6,14.926Z></path> <rect height=1 width=1 x=5 y=15></rect> <path d=M10.668,13.8L10.317,13H10v1h0.792A1.947,1.947,0,0,1,10.668,13.8Z></path> <rect height=1 width=1 x=11 y=15></rect> <path d=M14.332,12.2a1.99,1.99,0,0,1,.166.8H15V12H14.245Z></path> <rect height=1 width=1 x=14 y=15></rect> <rect height=1 width=1 x=15 y=11></rect> </g> <polyline class=ql-stroke points=\"5.5 13 9 5 12.5 13\"></polyline> <line class=ql-stroke x1=11.63 x2=6.38 y1=11 y2=11></line> </svg>";
var blockquote = "<svg viewbox=\"0 0 18 18\"> <rect class=\"ql-fill ql-stroke\" height=3 width=3 x=4 y=5></rect> <rect class=\"ql-fill ql-stroke\" height=3 width=3 x=11 y=5></rect> <path class=\"ql-even ql-fill ql-stroke\" d=M7,8c0,4.031-3,5-3,5></path> <path class=\"ql-even ql-fill ql-stroke\" d=M14,8c0,4.031-3,5-3,5></path> </svg>";
var bold = "<svg viewbox=\"0 0 18 18\"> <path class=ql-stroke d=M5,4H9.5A2.5,2.5,0,0,1,12,6.5v0A2.5,2.5,0,0,1,9.5,9H5A0,0,0,0,1,5,9V4A0,0,0,0,1,5,4Z></path> <path class=ql-stroke d=M5,9h5.5A2.5,2.5,0,0,1,13,11.5v0A2.5,2.5,0,0,1,10.5,14H5a0,0,0,0,1,0,0V9A0,0,0,0,1,5,9Z></path> </svg>";
var clean = "<svg class=\"\" viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=5 x2=13 y1=3 y2=3></line> <line class=ql-stroke x1=6 x2=9.35 y1=12 y2=3></line> <line class=ql-stroke x1=11 x2=15 y1=11 y2=15></line> <line class=ql-stroke x1=15 x2=11 y1=11 y2=15></line> <rect class=ql-fill height=1 rx=0.5 ry=0.5 width=7 x=2 y=14></rect> </svg>";
var code = "<svg viewbox=\"0 0 18 18\"> <polyline class=\"ql-even ql-stroke\" points=\"5 7 3 9 5 11\"></polyline> <polyline class=\"ql-even ql-stroke\" points=\"13 7 15 9 13 11\"></polyline> <line class=ql-stroke x1=10 x2=8 y1=5 y2=13></line> </svg>";
var color = "<svg viewbox=\"0 0 18 18\"> <line class=\"ql-color-label ql-stroke ql-transparent\" x1=3 x2=15 y1=15 y2=15></line> <polyline class=ql-stroke points=\"5.5 11 9 3 12.5 11\"></polyline> <line class=ql-stroke x1=11.63 x2=6.38 y1=9 y2=9></line> </svg>";
var direction_ltr = "<svg viewbox=\"0 0 18 18\"> <polygon class=\"ql-stroke ql-fill\" points=\"3 11 5 9 3 7 3 11\"></polygon> <line class=\"ql-stroke ql-fill\" x1=15 x2=11 y1=4 y2=4></line> <path class=ql-fill d=M11,3a3,3,0,0,0,0,6h1V3H11Z></path> <rect class=ql-fill height=11 width=1 x=11 y=4></rect> <rect class=ql-fill height=11 width=1 x=13 y=4></rect> </svg>";
var direction_rtl = "<svg viewbox=\"0 0 18 18\"> <polygon class=\"ql-stroke ql-fill\" points=\"15 12 13 10 15 8 15 12\"></polygon> <line class=\"ql-stroke ql-fill\" x1=9 x2=5 y1=4 y2=4></line> <path class=ql-fill d=M5,3A3,3,0,0,0,5,9H6V3H5Z></path> <rect class=ql-fill height=11 width=1 x=5 y=4></rect> <rect class=ql-fill height=11 width=1 x=7 y=4></rect> </svg>";
var dropdown = "<svg viewbox=\"0 0 18 18\"> <polygon class=ql-stroke points=\"7 11 9 13 11 11 7 11\"></polygon> <polygon class=ql-stroke points=\"7 7 9 5 11 7 7 7\"></polygon> </svg>";
var float_center = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M14,16H4a1,1,0,0,1,0-2H14A1,1,0,0,1,14,16Z /> <path class=ql-fill d=M14,4H4A1,1,0,0,1,4,2H14A1,1,0,0,1,14,4Z /> <rect class=ql-fill x=3 y=6 width=12 height=6 rx=1 ry=1 /> </svg>";
var float_full = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M13,16H5a1,1,0,0,1,0-2h8A1,1,0,0,1,13,16Z /> <path class=ql-fill d=M13,4H5A1,1,0,0,1,5,2h8A1,1,0,0,1,13,4Z /> <rect class=ql-fill x=2 y=6 width=14 height=6 rx=1 ry=1 /> </svg>";
var float_left = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M15,8H13a1,1,0,0,1,0-2h2A1,1,0,0,1,15,8Z /> <path class=ql-fill d=M15,12H13a1,1,0,0,1,0-2h2A1,1,0,0,1,15,12Z /> <path class=ql-fill d=M15,16H5a1,1,0,0,1,0-2H15A1,1,0,0,1,15,16Z /> <path class=ql-fill d=M15,4H5A1,1,0,0,1,5,2H15A1,1,0,0,1,15,4Z /> <rect class=ql-fill x=2 y=6 width=8 height=6 rx=1 ry=1 /> </svg>";
var float_right = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M5,8H3A1,1,0,0,1,3,6H5A1,1,0,0,1,5,8Z /> <path class=ql-fill d=M5,12H3a1,1,0,0,1,0-2H5A1,1,0,0,1,5,12Z /> <path class=ql-fill d=M13,16H3a1,1,0,0,1,0-2H13A1,1,0,0,1,13,16Z /> <path class=ql-fill d=M13,4H3A1,1,0,0,1,3,2H13A1,1,0,0,1,13,4Z /> <rect class=ql-fill x=8 y=6 width=8 height=6 rx=1 ry=1 transform=\"translate(24 18) rotate(-180)\"/> </svg>";
var formula = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M11.759,2.482a2.561,2.561,0,0,0-3.53.607A7.656,7.656,0,0,0,6.8,6.2C6.109,9.188,5.275,14.677,4.15,14.927a1.545,1.545,0,0,0-1.3-.933A0.922,0.922,0,0,0,2,15.036S1.954,16,4.119,16s3.091-2.691,3.7-5.553c0.177-.826.36-1.726,0.554-2.6L8.775,6.2c0.381-1.421.807-2.521,1.306-2.676a1.014,1.014,0,0,0,1.02.56A0.966,0.966,0,0,0,11.759,2.482Z></path> <rect class=ql-fill height=1.6 rx=0.8 ry=0.8 width=5 x=5.15 y=6.2></rect> <path class=ql-fill d=M13.663,12.027a1.662,1.662,0,0,1,.266-0.276q0.193,0.069.456,0.138a2.1,2.1,0,0,0,.535.069,1.075,1.075,0,0,0,.767-0.3,1.044,1.044,0,0,0,.314-0.8,0.84,0.84,0,0,0-.238-0.619,0.8,0.8,0,0,0-.594-0.239,1.154,1.154,0,0,0-.781.3,4.607,4.607,0,0,0-.781,1q-0.091.15-.218,0.346l-0.246.38c-0.068-.288-0.137-0.582-0.212-0.885-0.459-1.847-2.494-.984-2.941-0.8-0.482.2-.353,0.647-0.094,0.529a0.869,0.869,0,0,1,1.281.585c0.217,0.751.377,1.436,0.527,2.038a5.688,5.688,0,0,1-.362.467,2.69,2.69,0,0,1-.264.271q-0.221-.08-0.471-0.147a2.029,2.029,0,0,0-.522-0.066,1.079,1.079,0,0,0-.768.3A1.058,1.058,0,0,0,9,15.131a0.82,0.82,0,0,0,.832.852,1.134,1.134,0,0,0,.787-0.3,5.11,5.11,0,0,0,.776-0.993q0.141-.219.215-0.34c0.046-.076.122-0.194,0.223-0.346a2.786,2.786,0,0,0,.918,1.726,2.582,2.582,0,0,0,2.376-.185c0.317-.181.212-0.565,0-0.494A0.807,0.807,0,0,1,14.176,15a5.159,5.159,0,0,1-.913-2.446l0,0Q13.487,12.24,13.663,12.027Z></path> </svg>";
var header = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=3 x2=3 y1=4 y2=14></line> <line class=ql-stroke x1=11 x2=11 y1=4 y2=14></line> <line class=ql-stroke x1=11 x2=3 y1=9 y2=9></line> <line class=\"ql-stroke ql-thin\" x1=13.5 x2=15.5 y1=14.5 y2=14.5></line> <path class=ql-fill d=M14.5,15a0.5,0.5,0,0,1-.5-0.5V12.085l-0.276.138A0.5,0.5,0,0,1,13.053,12c-0.124-.247-0.023-0.324.224-0.447l1-.5A0.5,0.5,0,0,1,15,11.5v3A0.5,0.5,0,0,1,14.5,15Z></path> </svg>";
var header_2 = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=3 x2=3 y1=4 y2=14></line> <line class=ql-stroke x1=11 x2=11 y1=4 y2=14></line> <line class=ql-stroke x1=11 x2=3 y1=9 y2=9></line> <path class=\"ql-stroke ql-thin\" d=M15.5,14.5h-2c0-.234,1.85-1.076,1.85-2.234a0.959,0.959,0,0,0-1.85-.109></path> </svg>";
var image = "<svg viewbox=\"0 0 18 18\"> <rect class=ql-stroke height=10 width=12 x=3 y=4></rect> <circle class=ql-fill cx=6 cy=7 r=1></circle> <polyline class=\"ql-even ql-fill\" points=\"5 12 5 11 7 9 8 10 11 7 13 9 13 12 5 12\"></polyline> </svg>";
var indent = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=3 x2=15 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=9 x2=15 y1=9 y2=9></line> <polyline class=\"ql-fill ql-stroke\" points=\"3 7 3 11 5 9 3 7\"></polyline> </svg>";
var italic = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=7 x2=13 y1=4 y2=4></line> <line class=ql-stroke x1=5 x2=11 y1=14 y2=14></line> <line class=ql-stroke x1=8 x2=10 y1=14 y2=4></line> </svg>";
var link = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=7 x2=11 y1=7 y2=11></line> <path class=\"ql-even ql-stroke\" d=M8.9,4.577a3.476,3.476,0,0,1,.36,4.679A3.476,3.476,0,0,1,4.577,8.9C3.185,7.5,2.035,6.4,4.217,4.217S7.5,3.185,8.9,4.577Z></path> <path class=\"ql-even ql-stroke\" d=M13.423,9.1a3.476,3.476,0,0,0-4.679-.36,3.476,3.476,0,0,0,.36,4.679c1.392,1.392,2.5,2.542,4.679.36S14.815,10.5,13.423,9.1Z></path> </svg>";
var list_bullet = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=6 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=6 x2=15 y1=9 y2=9></line> <line class=ql-stroke x1=6 x2=15 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=3 y1=4 y2=4></line> <line class=ql-stroke x1=3 x2=3 y1=9 y2=9></line> <line class=ql-stroke x1=3 x2=3 y1=14 y2=14></line> </svg>";
var list_check = "<svg class=\"\" viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=9 x2=15 y1=4 y2=4></line> <polyline class=ql-stroke points=\"3 4 4 5 6 3\"></polyline> <line class=ql-stroke x1=9 x2=15 y1=14 y2=14></line> <polyline class=ql-stroke points=\"3 14 4 15 6 13\"></polyline> <line class=ql-stroke x1=9 x2=15 y1=9 y2=9></line> <polyline class=ql-stroke points=\"3 9 4 10 6 8\"></polyline> </svg>";
var list_ordered = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=7 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=7 x2=15 y1=9 y2=9></line> <line class=ql-stroke x1=7 x2=15 y1=14 y2=14></line> <line class=\"ql-stroke ql-thin\" x1=2.5 x2=4.5 y1=5.5 y2=5.5></line> <path class=ql-fill d=M3.5,6A0.5,0.5,0,0,1,3,5.5V3.085l-0.276.138A0.5,0.5,0,0,1,2.053,3c-0.124-.247-0.023-0.324.224-0.447l1-.5A0.5,0.5,0,0,1,4,2.5v3A0.5,0.5,0,0,1,3.5,6Z></path> <path class=\"ql-stroke ql-thin\" d=M4.5,10.5h-2c0-.234,1.85-1.076,1.85-2.234A0.959,0.959,0,0,0,2.5,8.156></path> <path class=\"ql-stroke ql-thin\" d=M2.5,14.846a0.959,0.959,0,0,0,1.85-.109A0.7,0.7,0,0,0,3.75,14a0.688,0.688,0,0,0,.6-0.736,0.959,0.959,0,0,0-1.85-.109></path> </svg>";
var outdent = "<svg viewbox=\"0 0 18 18\"> <line class=ql-stroke x1=3 x2=15 y1=14 y2=14></line> <line class=ql-stroke x1=3 x2=15 y1=4 y2=4></line> <line class=ql-stroke x1=9 x2=15 y1=9 y2=9></line> <polyline class=ql-stroke points=\"5 7 5 11 3 9 5 7\"></polyline> </svg>";
var strike = "<svg viewbox=\"0 0 18 18\"> <line class=\"ql-stroke ql-thin\" x1=15.5 x2=2.5 y1=8.5 y2=9.5></line> <path class=ql-fill d=M9.007,8C6.542,7.791,6,7.519,6,6.5,6,5.792,7.283,5,9,5c1.571,0,2.765.679,2.969,1.309a1,1,0,0,0,1.9-.617C13.356,4.106,11.354,3,9,3,6.2,3,4,4.538,4,6.5a3.2,3.2,0,0,0,.5,1.843Z></path> <path class=ql-fill d=M8.984,10C11.457,10.208,12,10.479,12,11.5c0,0.708-1.283,1.5-3,1.5-1.571,0-2.765-.679-2.969-1.309a1,1,0,1,0-1.9.617C4.644,13.894,6.646,15,9,15c2.8,0,5-1.538,5-3.5a3.2,3.2,0,0,0-.5-1.843Z></path> </svg>";
var subscript = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M15.5,15H13.861a3.858,3.858,0,0,0,1.914-2.975,1.8,1.8,0,0,0-1.6-1.751A1.921,1.921,0,0,0,12.021,11.7a0.50013,0.50013,0,1,0,.957.291h0a0.914,0.914,0,0,1,1.053-.725,0.81,0.81,0,0,1,.744.762c0,1.076-1.16971,1.86982-1.93971,2.43082A1.45639,1.45639,0,0,0,12,15.5a0.5,0.5,0,0,0,.5.5h3A0.5,0.5,0,0,0,15.5,15Z /> <path class=ql-fill d=M9.65,5.241a1,1,0,0,0-1.409.108L6,7.964,3.759,5.349A1,1,0,0,0,2.192,6.59178Q2.21541,6.6213,2.241,6.649L4.684,9.5,2.241,12.35A1,1,0,0,0,3.71,13.70722q0.02557-.02768.049-0.05722L6,11.036,8.241,13.65a1,1,0,1,0,1.567-1.24277Q9.78459,12.3777,9.759,12.35L7.316,9.5,9.759,6.651A1,1,0,0,0,9.65,5.241Z /> </svg>";
var superscript = "<svg viewbox=\"0 0 18 18\"> <path class=ql-fill d=M15.5,7H13.861a4.015,4.015,0,0,0,1.914-2.975,1.8,1.8,0,0,0-1.6-1.751A1.922,1.922,0,0,0,12.021,3.7a0.5,0.5,0,1,0,.957.291,0.917,0.917,0,0,1,1.053-.725,0.81,0.81,0,0,1,.744.762c0,1.077-1.164,1.925-1.934,2.486A1.423,1.423,0,0,0,12,7.5a0.5,0.5,0,0,0,.5.5h3A0.5,0.5,0,0,0,15.5,7Z /> <path class=ql-fill d=M9.651,5.241a1,1,0,0,0-1.41.108L6,7.964,3.759,5.349a1,1,0,1,0-1.519,1.3L4.683,9.5,2.241,12.35a1,1,0,1,0,1.519,1.3L6,11.036,8.241,13.65a1,1,0,0,0,1.519-1.3L7.317,9.5,9.759,6.651A1,1,0,0,0,9.651,5.241Z /> </svg>";
var underline = "<svg viewbox=\"0 0 18 18\"> <path class=ql-stroke d=M5,3V9a4.012,4.012,0,0,0,4,4H9a4.012,4.012,0,0,0,4-4V3></path> <rect class=ql-fill height=1 rx=0.5 ry=0.5 width=12 x=3 y=15></rect> </svg>";
var video = "<svg viewbox=\"0 0 18 18\"> <rect class=ql-stroke height=12 width=12 x=3 y=3></rect> <rect class=ql-fill height=12 width=1 x=5 y=3></rect> <rect class=ql-fill height=12 width=1 x=12 y=3></rect> <rect class=ql-fill height=2 width=8 x=5 y=8></rect> <rect class=ql-fill height=1 width=3 x=3 y=5></rect> <rect class=ql-fill height=1 width=3 x=3 y=7></rect> <rect class=ql-fill height=1 width=3 x=3 y=10></rect> <rect class=ql-fill height=1 width=3 x=3 y=12></rect> <rect class=ql-fill height=1 width=3 x=12 y=5></rect> <rect class=ql-fill height=1 width=3 x=12 y=7></rect> <rect class=ql-fill height=1 width=3 x=12 y=10></rect> <rect class=ql-fill height=1 width=3 x=12 y=12></rect> </svg>";
var Embed = (function (_super) {
    __extends(Embed, _super);
    function Embed(domNode) {
        return _super.call(this, domNode) || this;
    }
    return Embed;
}(Parchment.EmbedBlot));
var TextBlot = (function (_super) {
    __extends(TextBlot, _super);
    function TextBlot() {
        return _super.apply(this, arguments) || this;
    }
    return TextBlot;
}(Parchment.TextBlot));
//import Embed from './embed';
///<reference path='./text.ts' />
//import Text from './text';
//import Parchment from 'parchment';
var Inline = (function (_super) {
    __extends(Inline, _super);
    function Inline() {
        return _super.apply(this, arguments) || this;
    }
    Inline.compare = function (self, other) {
        var selfIndex = Inline.order.indexOf(self);
        var otherIndex = Inline.order.indexOf(other);
        if (selfIndex >= 0 || otherIndex >= 0) {
            return selfIndex - otherIndex;
        }
        else if (self === other) {
            return 0;
        }
        else if (self < other) {
            return -1;
        }
        else {
            return 1;
        }
    };
    Inline.prototype.formatAt = function (index, length, name, value) {
        if (Inline.compare(this.statics.blotName, name) < 0 && Parchment.query(name, Parchment.Scope.BLOT)) {
            var blot = this.isolate(index, length);
            if (value) {
                blot.wrap(name, value);
            }
        }
        else {
            _super.prototype.formatAt.call(this, index, length, name, value);
        }
    };
    Inline.prototype.optimize = function () {
        _super.prototype.optimize.call(this);
        if (this.parent instanceof Inline &&
            Inline.compare(this.statics.blotName, this.parent.statics.blotName) > 0) {
            var parent_2 = this.parent.isolate(this.offset(), this.length());
            this.moveChildren(parent_2);
            parent_2.wrap(this);
        }
    };
    return Inline;
}(Parchment.InlineBlot));
Inline.order = [
    'cursor', 'inline',
    'code', 'underline', 'strike', 'italic', 'bold', 'script',
    'link' // Must be higher
];
Inline.allowedChildren = [Inline, Embed, TextBlot];
// Lower index means deeper in the DOM tree, since not found (-1) is for embeds
//Inline.order = [
//    'cursor', 'inline',   // Must be lower
//    'code', 'underline', 'strike', 'italic', 'bold', 'script',
//    'link'                // Must be higher
//];
// export default Inline; 
//import extend from 'extend';
//import Delta from 'quill-delta';
//import Parchment from 'parchment';
//import Break from './break';
///<reference path='./embed.ts' />
//import Embed from './embed';
///<reference path='./inline.ts' />
//import Inline from './inline';
///<reference path='./text.ts' />
//import TextBlot from './text';
var NEWLINE_LENGTH = 1;
var BlockEmbed = (function (_super) {
    __extends(BlockEmbed, _super);
    function BlockEmbed() {
        return _super.apply(this, arguments) || this;
    }
    BlockEmbed.prototype.attach = function () {
        _super.prototype.attach.call(this);
        this.attributes = new Parchment.AttributorStore(this.domNode);
    };
    BlockEmbed.prototype.delta = function () {
        return new Delta().insert(this.value(), extend(this.formats(), this.attributes.values()));
    };
    BlockEmbed.prototype.format = function (name, value) {
        var attribute = Parchment.query(name, Parchment.Scope.BLOCK_ATTRIBUTE);
        if (attribute != null) {
            this.attributes.attribute(attribute, value);
        }
    };
    BlockEmbed.prototype.formatAt = function (index, length, name, value) {
        this.format(name, value);
    };
    BlockEmbed.prototype.insertAt = function (index, value, def) {
        if (typeof value === 'string' && value.endsWith('\n')) {
            var block = Parchment.create(Block.blotName);
            this.parent.insertBefore(block, index === 0 ? this : this.next);
            block.insertAt(0, value.slice(0, -1));
        }
        else {
            _super.prototype.insertAt.call(this, index, value, def);
        }
    };
    return BlockEmbed;
}(Embed));
BlockEmbed.scope = Parchment.Scope.BLOCK_BLOT;
// It is important for cursor behavior BlockEmbeds use tags that are block level elements
var Block = (function (_super) {
    __extends(Block, _super);
    function Block(domNode) {
        var _this = _super.call(this, domNode) || this;
        _this.cache = {};
        return _this;
    }
    Block.prototype.delta = function () {
        if (this.cache.delta == null) {
            this.cache.delta = this.descendants(Parchment.LeafBlot).reduce(function (delta, leaf) {
                if (leaf.length() === 0) {
                    return delta;
                }
                else {
                    return delta.insert(leaf.value(), bubbleFormats(leaf));
                }
            }, new Delta()).insert('\n', bubbleFormats(this));
        }
        return this.cache.delta;
    };
    Block.prototype.deleteAt = function (index, length) {
        _super.prototype.deleteAt.call(this, index, length);
        this.cache = {};
    };
    Block.prototype.formatAt = function (index, length, name, value) {
        if (length <= 0)
            return;
        if (Parchment.query(name, Parchment.Scope.BLOCK)) {
            if (index + length === this.length()) {
                this.format(name, value);
            }
        }
        else {
            _super.prototype.formatAt.call(this, index, Math.min(length, this.length() - index - 1), name, value);
        }
        this.cache = {};
    };
    Block.prototype.insertAt = function (index, value, def) {
        if (def != null)
            return _super.prototype.insertAt.call(this, index, value, def);
        if (value.length === 0)
            return;
        var lines = value.split('\n');
        var text = lines.shift();
        if (text.length > 0) {
            if (index < this.length() - 1 || this.children.tail == null) {
                _super.prototype.insertAt.call(this, Math.min(index, this.length() - 1), text);
            }
            else {
                this.children.tail.insertAt(this.children.tail.length(), text);
            }
            this.cache = {};
        }
        var block = this;
        lines.reduce(function (index, line) {
            block = block.split(index, true);
            block.insertAt(0, line);
            return line.length;
        }, index + text.length);
    };
    Block.prototype.insertBefore = function (blot, ref) {
        var head = this.children.head;
        _super.prototype.insertBefore.call(this, blot, ref);
        if (head instanceof Break) {
            head.remove();
        }
        this.cache = {};
    };
    Block.prototype.length = function () {
        if (this.cache.length == null) {
            this.cache.length = _super.prototype.length.call(this) + NEWLINE_LENGTH;
        }
        return this.cache.length;
    };
    Block.prototype.moveChildren = function (target, ref) {
        _super.prototype.moveChildren.call(this, target, ref);
        this.cache = {};
    };
    Block.prototype.optimize = function () {
        _super.prototype.optimize.call(this);
        this.cache = {};
    };
    Block.prototype.path = function (index) {
        return _super.prototype.path.call(this, index, true);
    };
    Block.prototype.removeChild = function (child) {
        _super.prototype.removeChild.call(this, child);
        this.cache = {};
    };
    Block.prototype.split = function (index, force) {
        if (force === void 0) { force = false; }
        if (force && (index === 0 || index >= this.length() - NEWLINE_LENGTH)) {
            var clone_1 = this.clone();
            if (index === 0) {
                this.parent.insertBefore(clone_1, this);
                return this;
            }
            else {
                this.parent.insertBefore(clone_1, this.next);
                return clone_1;
            }
        }
        else {
            var next = _super.prototype.split.call(this, index, force);
            this.cache = {};
            return next;
        }
    };
    return Block;
}(Parchment.BlockBlot));
Block.blotName = 'block';
Block.tagName = 'P';
Block.defaultChild = 'break';
Block.allowedChildren = [Inline, Embed, TextBlot];
function bubbleFormats(blot, formats) {
    if (formats === void 0) { formats = {}; }
    if (blot == null)
        return formats;
    if (typeof blot.formats === 'function') {
        formats = extend(formats, blot.formats());
    }
    if (blot.parent == null || blot.parent.blotName == 'scroll' || blot.parent.statics.scope !== blot.statics.scope) {
        return formats;
    }
    return bubbleFormats(blot.parent, formats);
}
// export { bubbleFormats, BlockEmbed, Block as default }; 
///<reference path='./embed.ts' />
//import Embed from './embed';
var Break = (function (_super) {
    __extends(Break, _super);
    function Break() {
        return _super.apply(this, arguments) || this;
    }
    Break.value = function () {
        return undefined;
    };
    Break.prototype.insertInto = function (parent, ref) {
        if (parent.children.length === 0) {
            _super.prototype.insertInto.call(this, parent, ref);
        }
        else {
            this.remove();
        }
    };
    Break.prototype.length = function () {
        return 0;
    };
    Break.prototype.value = function () {
        return '';
    };
    return Break;
}(Embed));
Break.blotName = 'break';
Break.tagName = 'BR';
//export default Break; 
// import Parchment from 'parchment';
///<reference path='./block.ts' />
// import Block, { BlockEmbed } from './block';
var Container = (function (_super) {
    __extends(Container, _super);
    function Container() {
        return _super.apply(this, arguments) || this;
    }
    return Container;
}(Parchment.ContainerBlot));
Container.allowedChildren = [Block, BlockEmbed, Container];
// export default Container; 
var levels = ['error', 'warn', 'log', 'info'];
var level = 'warn';
function debug(method) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (levels.indexOf(method) <= levels.indexOf(level)) {
        console[method].apply(console, args); // eslint-disable-line no-console
    }
}
function _namespace(ns) {
    return levels.reduce(function (logger, method) {
        // logger[method] = debug.bind(console, method, ns);
        return logger;
    }, {});
}
debug.level = _namespace.level = function (newLevel) {
    level = newLevel;
};
//export default namespace; 
// import EventEmitter from 'eventemitter3';
///<reference path='./logger.ts' />
// import logger from './logger';
var debug = _namespace('quill:events');
var Emitter = (function (_super) {
    __extends(Emitter, _super);
    function Emitter() {
        var _this = _super.call(this) || this;
        _this.on('error', debug.error);
        return _this;
    }
    Emitter.prototype.emit = function () {
        // debug.log.apply(debug, arguments);
        _super.prototype.emit.apply(this, arguments);
    };
    return Emitter;
}(EventEmitter));
Emitter.events = {
    EDITOR_CHANGE: 'editor-change',
    SCROLL_BEFORE_UPDATE: 'scroll-before-update',
    SCROLL_OPTIMIZE: 'scroll-optimize',
    SCROLL_UPDATE: 'scroll-update',
    SELECTION_CHANGE: 'selection-change',
    TEXT_CHANGE: 'text-change'
};
Emitter.sources = {
    API: 'api',
    SILENT: 'silent',
    USER: 'user'
};
// export default Emitter; 
//import Parchment from 'parchment';
///<reference path='./embed.ts' />
//import Embed from './embed';
///<reference path='./text.ts' />
//import TextBlot from './text';
///<reference path='../core/emitter' />
//import Emitter from '../core/emitter';
var Cursor = (function (_super) {
    __extends(Cursor, _super);
    function Cursor(domNode, selection) {
        var _this = _super.call(this, domNode) || this;
        _this.selection = selection;
        _this.textNode = document.createTextNode(Cursor.CONTENTS);
        _this._length = 0;
        // this.selection = selection;
        // this.textNode = document.createTextNode(Cursor.CONTENTS);
        _this.domNode.appendChild(_this.textNode);
        return _this;
        // this._length = 0;
    }
    Cursor.value = function () {
        return undefined;
    };
    Cursor.prototype.detach = function () {
        // super.detach() will also clear domNode.__blot
        if (this.parent != null)
            this.parent.removeChild(this);
    };
    Cursor.prototype.format = function (name, value) {
        if (this._length !== 0) {
            return _super.prototype.format.call(this, name, value);
        }
        var target = this, index = 0;
        while (target != null && target.statics.scope !== Parchment.Scope.BLOCK_BLOT) {
            index += target.offset(target.parent);
            target = target.parent;
        }
        if (target != null) {
            this._length = Cursor.CONTENTS.length;
            target.optimize();
            target.formatAt(index, Cursor.CONTENTS.length, name, value);
            this._length = 0;
        }
    };
    Cursor.prototype.index = function (node, offset) {
        if (node === this.textNode)
            return 0;
        return _super.prototype.index.call(this, node, offset);
    };
    Cursor.prototype.length = function () {
        return this._length;
    };
    Cursor.prototype.position = function () {
        return [this.textNode, this.textNode.data.length];
    };
    Cursor.prototype.remove = function () {
        _super.prototype.remove.call(this);
        this.parent = null;
    };
    Cursor.prototype.restore = function () {
        var _this = this;
        if (this.selection.composing)
            return;
        if (this.parent == null)
            return;
        var textNode = this.textNode;
        var range = this.selection.getNativeRange();
        var restoreText, start, end;
        if (range != null && range.start.node === textNode && range.end.node === textNode) {
            _a = [textNode, range.start.offset, range.end.offset], restoreText = _a[0], start = _a[1], end = _a[2];
        }
        // Link format will insert text outside of anchor tag
        while (this.domNode.lastChild != null && this.domNode.lastChild !== this.textNode) {
            this.domNode.parentNode.insertBefore(this.domNode.lastChild, this.domNode);
        }
        if (this.textNode.data !== Cursor.CONTENTS) {
            var text = this.textNode.data.split(Cursor.CONTENTS).join('');
            if (this.next instanceof TextBlot) {
                restoreText = this.next.domNode;
                this.next.insertAt(0, text);
                this.textNode.data = Cursor.CONTENTS;
            }
            else {
                this.textNode.data = text;
                this.parent.insertBefore(Parchment.create(this.textNode), this);
                this.textNode = document.createTextNode(Cursor.CONTENTS);
                this.domNode.appendChild(this.textNode);
            }
        }
        this.remove();
        if (start == null)
            return;
        this.selection.emitter.once(Emitter.events.SCROLL_OPTIMIZE, function () {
            _a = [start, end].map(function (offset) {
                return Math.max(0, Math.min(restoreText.data.length, offset - 1));
            }), start = _a[0], end = _a[1];
            _this.selection.setNativeRange(restoreText, start, restoreText, end);
            var _a;
        });
        var _a;
    };
    Cursor.prototype.update = function (mutations) {
        var _this = this;
        mutations.forEach(function (mutation) {
            if (mutation.type === 'characterData' && mutation.target === _this.textNode) {
                _this.restore();
            }
        });
    };
    Cursor.prototype.value = function () {
        return '';
    };
    return Cursor;
}(Embed));
Cursor.blotName = 'cursor';
Cursor.className = 'ql-cursor';
Cursor.tagName = 'span';
Cursor.CONTENTS = "\uFEFF"; // Zero width no break space
//Cursor.blotName = 'cursor';
//Cursor.className = 'ql-cursor';
//Cursor.tagName = 'span';
//Cursor.CONTENTS = "\uFEFF";   // Zero width no break space
// export default Cursor; 
// import Parchment from 'parchment';
// import Emitter from '../core/emitter';
// import Block, { BlockEmbed } from './block';
// import Break from './break';
// import Container from './container';
// import CodeBlock from '../formats/code';
function _isLine(blot) {
    return (blot instanceof Block || blot instanceof BlockEmbed);
}
var Scroll = (function (_super) {
    __extends(Scroll, _super);
    function Scroll(domNode, config) {
        var _this = _super.call(this, domNode) || this;
        _this.emitter = config.emitter;
        if (Array.isArray(config.whitelist)) {
            _this.whitelist = config.whitelist.reduce(function (whitelist, format) {
                whitelist[format] = true;
                return whitelist;
            }, {});
        }
        _this.optimize();
        _this.enable();
        return _this;
    }
    Scroll.prototype.deleteAt = function (index, length) {
        var _a = this.line(index), first = _a[0], offset = _a[1];
        var last = this.line(index + length)[0];
        _super.prototype.deleteAt.call(this, index, length);
        if (last != null && first !== last && offset > 0 &&
            !(first instanceof BlockEmbed) && !(last instanceof BlockEmbed)) {
            if (last instanceof CodeBlock) {
                last.deleteAt(last.length() - 1, 1);
            }
            var ref = last.children.head instanceof Break ? null : last.children.head;
            first.moveChildren(last, ref);
            first.remove();
        }
        this.optimize();
    };
    Scroll.prototype.enable = function (enabled) {
        if (enabled === void 0) { enabled = true; }
        this.domNode.setAttribute('contenteditable', enabled);
    };
    Scroll.prototype.formatAt = function (index, length, format, value) {
        if (this.whitelist != null && !this.whitelist[format])
            return;
        _super.prototype.formatAt.call(this, index, length, format, value);
        this.optimize();
    };
    Scroll.prototype.insertAt = function (index, value, def) {
        if (def != null && this.whitelist != null && !this.whitelist[value])
            return;
        if (index >= this.length()) {
            if (def == null || Parchment.query(value, Parchment.Scope.BLOCK) == null) {
                var blot = Parchment.create(this.statics.defaultChild);
                this.appendChild(blot);
                if (def == null && value.endsWith('\n')) {
                    value = value.slice(0, -1);
                }
                blot.insertAt(0, value, def);
            }
            else {
                var embed = Parchment.create(value, def);
                this.appendChild(embed);
            }
        }
        else {
            _super.prototype.insertAt.call(this, index, value, def);
        }
        this.optimize();
    };
    Scroll.prototype.insertBefore = function (blot, ref) {
        if (blot.statics.scope === Parchment.Scope.INLINE_BLOT) {
            var wrapper = Parchment.create(this.statics.defaultChild);
            wrapper.appendChild(blot);
            blot = wrapper;
        }
        _super.prototype.insertBefore.call(this, blot, ref);
    };
    Scroll.prototype.leaf = function (index) {
        return this.path(index).pop() || [null, -1];
    };
    Scroll.prototype.line = function (index) {
        if (index === this.length()) {
            return this.line(index - 1);
        }
        return this.descendant(_isLine, index);
    };
    Scroll.prototype.lines = function (index, length) {
        if (index === void 0) { index = 0; }
        if (length === void 0) { length = Number.MAX_VALUE; }
        var getLines = function (blot, index, length) {
            var lines = [], lengthLeft = length;
            blot.children.forEachAt(index, length, function (child, index, length) {
                if (_isLine(child)) {
                    lines.push(child);
                }
                else if (child instanceof Parchment.Container) {
                    lines = lines.concat(getLines(child, index, lengthLeft));
                }
                lengthLeft -= length;
            });
            return lines;
        };
        return getLines(this, index, length);
    };
    Scroll.prototype.optimize = function (mutations) {
        if (mutations === void 0) { mutations = []; }
        if (this.batch === true)
            return;
        _super.prototype.optimize.call(this, mutations);
        if (mutations.length > 0) {
            this.emitter.emit(Emitter.events.SCROLL_OPTIMIZE, mutations);
        }
    };
    Scroll.prototype.path = function (index) {
        return _super.prototype.path.call(this, index).slice(1); // Exclude self
    };
    Scroll.prototype.update = function (mutations) {
        if (this.batch === true)
            return;
        var source = Emitter.sources.USER;
        if (typeof mutations === 'string') {
            source = mutations;
        }
        if (!Array.isArray(mutations)) {
            mutations = this.observer.takeRecords();
        }
        if (mutations.length > 0) {
            this.emitter.emit(Emitter.events.SCROLL_BEFORE_UPDATE, source, mutations);
        }
        _super.prototype.update.call(this, mutations.concat([])); // pass copy
        if (mutations.length > 0) {
            this.emitter.emit(Emitter.events.SCROLL_UPDATE, source, mutations);
        }
    };
    return Scroll;
}(Parchment.ScrollBlot));
Scroll.blotName = 'scroll';
Scroll.className = 'ql-editor';
Scroll.tagName = 'DIV';
Scroll.defaultChild = 'block';
Scroll.allowedChildren = [Block, BlockEmbed, Container];
// export default Scroll; 
//import Delta from 'quill-delta';
//import Parchment from 'parchment';
///<reference path='../blots/block.ts' />
//import Block from '../blots/block';
///<reference path='../blots/inline.ts' />
//import Inline from '../blots/inline';
///<reference path='../blots/text.ts' />
//import TextBlot from '../blots/text';
var Code = (function (_super) {
    __extends(Code, _super);
    function Code() {
        return _super.apply(this, arguments) || this;
    }
    return Code;
}(Inline));
Code.blotName = 'code';
Code.tagName = 'CODE';
var CodeBlock = (function (_super) {
    __extends(CodeBlock, _super);
    function CodeBlock() {
        return _super.apply(this, arguments) || this;
    }
    CodeBlock.create = function (value) {
        var domNode = _super.create.call(this, value);
        domNode.setAttribute('spellcheck', false);
        return domNode;
    };
    CodeBlock.formats = function () {
        return true;
    };
    CodeBlock.prototype.delta = function () {
        var _this = this;
        var text = this.domNode.textContent;
        if (text.endsWith('\n')) {
            text = text.slice(0, -1);
        }
        return text.split('\n').reduce(function (delta, frag) {
            return delta.insert(frag).insert('\n', _this.formats());
        }, new Delta());
    };
    CodeBlock.prototype.format = function (name, value) {
        if (name === this.statics.blotName && value)
            return;
        var text = this.descendant(TextBlot, this.length() - 1)[0];
        if (text != null) {
            text.deleteAt(text.length() - 1, 1);
        }
        _super.prototype.format.call(this, name, value);
    };
    CodeBlock.prototype.formatAt = function (index, length, name, value) {
        if (length === 0)
            return;
        if (Registry.query(name, /*Parchment*/ Registry.Scope.BLOCK) == null ||
            (name === this.statics.blotName && value === this.statics.formats(this.domNode))) {
            return;
        }
        var nextNewline = this.newlineIndex(index);
        if (nextNewline < 0 || nextNewline >= index + length)
            return;
        var prevNewline = this.newlineIndex(index, true) + 1;
        var isolateLength = nextNewline - prevNewline + 1;
        var blot = this.isolate(prevNewline, isolateLength);
        var next = blot.next;
        blot.format(name, value);
        if (next instanceof CodeBlock) {
            next.formatAt(0, index - prevNewline + length - isolateLength, name, value);
        }
    };
    CodeBlock.prototype.insertAt = function (index, value, def) {
        if (def != null)
            return;
        var _a = this.descendant(TextBlot, index), text = _a[0], offset = _a[1];
        text.insertAt(offset, value);
    };
    CodeBlock.prototype.length = function () {
        var length = this.domNode.textContent.length;
        if (!this.domNode.textContent.endsWith('\n')) {
            return length + 1;
        }
        return length;
    };
    CodeBlock.prototype.newlineIndex = function (searchIndex, reverse) {
        if (reverse === void 0) { reverse = false; }
        if (!reverse) {
            var offset = this.domNode.textContent.slice(searchIndex).indexOf('\n');
            return offset > -1 ? searchIndex + offset : -1;
        }
        else {
            return this.domNode.textContent.slice(0, searchIndex).lastIndexOf('\n');
        }
    };
    CodeBlock.prototype.optimize = function () {
        if (!this.domNode.textContent.endsWith('\n')) {
            this.appendChild(/*Parchment*/ Registry.create('text', '\n'));
        }
        _super.prototype.optimize.call(this);
        var next = this.next;
        if (next != null && next.prev === this &&
            next.statics.blotName === this.statics.blotName &&
            this.statics.formats(this.domNode) === next.statics.formats(next.domNode)) {
            next.optimize();
            next.moveChildren(this);
            next.remove();
        }
    };
    CodeBlock.prototype.replace = function (target) {
        _super.prototype.replace.call(this, target);
        [].slice.call(this.domNode.querySelectorAll('*')).forEach(function (node) {
            var blot = Registry.find(node);
            if (blot == null) {
                node.parentNode.removeChild(node);
            }
            else if (blot instanceof Embed) {
                blot.remove();
            }
            else {
                blot.unwrap();
            }
        });
    };
    return CodeBlock;
}(Block));
CodeBlock.blotName = 'code-block';
CodeBlock.tagName = 'PRE';
CodeBlock.TAB = '  ';
// export { Code, CodeBlock as default }; 
//import Delta from 'quill-delta';
//import DeltaOp from 'quill-delta/lib/op';
//import Parchment from 'parchment';
///<reference path='../formats/code.ts' />
///<reference path='../blots/cursor.ts' />
///<reference path='../blots/block.ts' />
var Editor = (function () {
    function Editor(scroll) {
        this.scroll = scroll;
        // this.scroll = scroll;
        this.delta = this.getDelta();
    }
    Editor.prototype.applyDelta = function (delta) {
        var _this = this;
        var consumeNextNewline = false;
        this.scroll.update();
        var scrollLength = this.scroll.length();
        this.scroll.batch = true;
        delta = normalizeDelta(delta);
        delta.reduce(function (index, op) {
            var length = op.retain || op.delete || op.insert.length || 1;
            var attributes = op.attributes || {};
            if (op.insert != null) {
                if (typeof op.insert === 'string') {
                    var text = op.insert;
                    if (text.endsWith('\n') && consumeNextNewline) {
                        consumeNextNewline = false;
                        text = text.slice(0, -1);
                    }
                    if (index >= scrollLength && !text.endsWith('\n')) {
                        consumeNextNewline = true;
                    }
                    _this.scroll.insertAt(index, text);
                    var _a = _this.scroll.line(index), line = _a[0], offset = _a[1];
                    var formats = extend({}, bubbleFormats(line));
                    if (line instanceof Block) {
                        var leaf = line.descendant(Parchment.LeafBlot, offset)[0];
                        formats = extend(formats, bubbleFormats(leaf));
                    }
                    attributes = lib.attributes.diff(formats, attributes) || {};
                }
                else if (typeof op.insert === 'object') {
                    var key = Object.keys(op.insert)[0]; // There should only be one key
                    if (key == null)
                        return index;
                    _this.scroll.insertAt(index, key, op.insert[key]);
                }
                scrollLength += length;
            }
            Object.keys(attributes).forEach(function (name) {
                _this.scroll.formatAt(index, length, name, attributes[name]);
            });
            return index + length;
        }, 0);
        delta.reduce(function (index, op) {
            if (typeof op.delete === 'number') {
                _this.scroll.deleteAt(index, op.delete);
                return index;
            }
            return index + (op.retain || op.insert.length || 1);
        }, 0);
        this.scroll.batch = false;
        this.scroll.optimize();
        return this.update(delta);
    };
    Editor.prototype.deleteText = function (index, length) {
        this.scroll.deleteAt(index, length);
        return this.update(new Delta().retain(index).delete(length));
    };
    Editor.prototype.formatLine = function (index, length, formats) {
        var _this = this;
        if (formats === void 0) { formats = {}; }
        this.scroll.update();
        Object.keys(formats).forEach(function (format) {
            var lines = _this.scroll.lines(index, Math.max(length, 1));
            var lengthRemaining = length;
            lines.forEach(function (line) {
                var lineLength = line.length();
                if (!(line instanceof CodeBlock)) {
                    line.format(format, formats[format]);
                }
                else {
                    var codeIndex = index - line.offset(_this.scroll);
                    var codeLength = line.newlineIndex(codeIndex + lengthRemaining) - codeIndex + 1;
                    line.formatAt(codeIndex, codeLength, format, formats[format]);
                }
                lengthRemaining -= lineLength;
            });
        });
        this.scroll.optimize();
        return this.update(new Delta().retain(index).retain(length, clone(formats)));
    };
    Editor.prototype.formatText = function (index, length, formats) {
        var _this = this;
        if (formats === void 0) { formats = {}; }
        Object.keys(formats).forEach(function (format) {
            _this.scroll.formatAt(index, length, format, formats[format]);
        });
        return this.update(new Delta().retain(index).retain(length, clone(formats)));
    };
    Editor.prototype.getContents = function (index, length) {
        return this.delta.slice(index, index + length);
    };
    Editor.prototype.getDelta = function () {
        return this.scroll.lines().reduce(function (delta, line) {
            return delta.concat(line.delta());
        }, new Delta());
    };
    Editor.prototype.getFormat = function (index, length) {
        if (length === void 0) { length = 0; }
        var lines = [], leaves = [];
        if (length === 0) {
            this.scroll.path(index).forEach(function (path) {
                var blot = path[0];
                if (blot instanceof Block) {
                    lines.push(blot);
                }
                else if (blot instanceof Parchment.LeafBlot) {
                    leaves.push(blot);
                }
            });
        }
        else {
            lines = this.scroll.lines(index, length);
            leaves = this.scroll.descendants(Parchment.LeafBlot, index, length);
        }
        var formatsArr = [lines, leaves].map(function (blots) {
            if (blots.length === 0)
                return {};
            var formats = bubbleFormats(blots.shift());
            while (Object.keys(formats).length > 0) {
                var blot = blots.shift();
                if (blot == null)
                    return formats;
                formats = combineFormats(bubbleFormats(blot), formats);
            }
            return formats;
        });
        return extend.apply(extend, formatsArr);
    };
    Editor.prototype.getText = function (index, length) {
        return this.getContents(index, length).filter(function (op) {
            return typeof op.insert === 'string';
        }).map(function (op) {
            return op.insert;
        }).join('');
    };
    Editor.prototype.insertEmbed = function (index, embed, value) {
        this.scroll.insertAt(index, embed, value);
        return this.update(new Delta().retain(index).insert((_a = {}, _a[embed] = value, _a)));
        var _a;
    };
    Editor.prototype.insertText = function (index, text, formats) {
        var _this = this;
        if (formats === void 0) { formats = {}; }
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        this.scroll.insertAt(index, text);
        Object.keys(formats).forEach(function (format) {
            _this.scroll.formatAt(index, text.length, format, formats[format]);
        });
        return this.update(new Delta().retain(index).insert(text, clone(formats)));
    };
    Editor.prototype.isBlank = function () {
        if (this.scroll.children.length == 0)
            return true;
        if (this.scroll.children.length > 1)
            return false;
        var child = this.scroll.children.head;
        return child.length() <= 1 && Object.keys(child.formats()).length == 0;
    };
    Editor.prototype.removeFormat = function (index, length) {
        var text = this.getText(index, length);
        var _a = this.scroll.line(index + length), line = _a[0], offset = _a[1];
        var suffixLength = 0, suffix = new Delta();
        if (line != null) {
            if (!(line instanceof CodeBlock)) {
                suffixLength = line.length() - offset;
            }
            else {
                suffixLength = line.newlineIndex(offset) - offset + 1;
            }
            suffix = line.delta().slice(offset, offset + suffixLength - 1).insert('\n');
        }
        var contents = this.getContents(index, length + suffixLength);
        var diff = contents.diff(new Delta().insert(text).concat(suffix));
        var delta = new Delta().retain(index).concat(diff);
        return this.applyDelta(delta);
    };
    Editor.prototype.update = function (change, mutations, cursorIndex) {
        if (mutations === void 0) { mutations = []; }
        if (cursorIndex === void 0) { cursorIndex = undefined; }
        var oldDelta = this.delta;
        if (mutations.length === 1 &&
            mutations[0].type === 'characterData' &&
            Parchment.find(mutations[0].target)) {
            // Optimization for character changes
            var textBlot = Parchment.find(mutations[0].target);
            var formats_1 = bubbleFormats(textBlot);
            var index = textBlot.offset(this.scroll);
            var oldValue = mutations[0].oldValue.replace(Cursor.CONTENTS, '');
            var oldText = new Delta().insert(oldValue);
            var newText = new Delta().insert(textBlot.value());
            var diffDelta = new Delta().retain(index).concat(oldText.diff(newText, cursorIndex));
            change = diffDelta.reduce(function (delta, op) {
                if (op.insert) {
                    return delta.insert(op.insert, formats_1);
                }
                else {
                    return delta.push(op);
                }
            }, new Delta());
            this.delta = oldDelta.compose(change);
        }
        else {
            this.delta = this.getDelta();
            if (!change || !equal(oldDelta.compose(change), this.delta)) {
                change = oldDelta.diff(this.delta, cursorIndex);
            }
        }
        return change;
    };
    return Editor;
}());
function combineFormats(formats, combined) {
    return Object.keys(combined).reduce(function (merged, name) {
        if (formats[name] == null)
            return merged;
        if (combined[name] === formats[name]) {
            merged[name] = combined[name];
        }
        else if (Array.isArray(combined[name])) {
            if (combined[name].indexOf(formats[name]) < 0) {
                merged[name] = combined[name].concat([formats[name]]);
            }
        }
        else {
            merged[name] = [combined[name], formats[name]];
        }
        return merged;
    }, {});
}
function normalizeDelta(delta) {
    return delta.reduce(function (delta, op) {
        if (op.insert === 1) {
            var attributes = clone(op.attributes);
            delete attributes['image'];
            return delta.insert({ image: op.attributes.image }, attributes);
        }
        if (op.attributes != null && (op.attributes.list === true || op.attributes.bullet === true)) {
            op = clone(op);
            if (op.attributes.list) {
                op.attributes.list = 'ordered';
            }
            else {
                op.attributes.list = 'bullet';
                delete op.attributes.bullet;
            }
        }
        if (typeof op.insert === 'string') {
            var text = op.insert.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            return delta.insert(text, op.attributes);
        }
        return delta.push(op);
    }, new Delta());
}
// export default Editor; 
var Module = (function () {
    function Module(quill, options) {
        if (options === void 0) { options = {}; }
        this.quill = quill;
        this.options = options;
    }
    return Module;
}());
Module.DEFAULTS = {};
// export default Module; 
//import Parchment from 'parchment';
//import clone from 'clone';
//import equal from 'deep-equal';
///<reference path='./emitter.ts' />
//import Emitter from './emitter';
///<reference path='./logger.ts' />
//import logger from './logger';
// let debug = logger('quill:selection');
var Range = (function () {
    function Range(index, length) {
        if (length === void 0) { length = 0; }
        this.index = index;
        this.length = length;
    }
    return Range;
}());
var Selection = (function () {
    function Selection(scroll, emitter) {
        var _this = this;
        this.emitter = emitter;
        this.scroll = scroll;
        this.composing = false;
        this.root = this.scroll.domNode;
        this.root.addEventListener('compositionstart', function () {
            _this.composing = true;
        });
        this.root.addEventListener('compositionend', function () {
            _this.composing = false;
        });
        this.cursor = Parchment.create('cursor', this);
        // savedRange is last non-null range
        this.lastRange = this.savedRange = new Range(0, 0);
        ['keyup', 'mouseup', 'mouseleave', 'touchend', 'touchleave', 'focus', 'blur'].forEach(function (eventName) {
            _this.root.addEventListener(eventName, function () {
                // When range used to be a selection and user click within the selection,
                // the range now being a cursor has not updated yet without setTimeout
                setTimeout(_this.update.bind(_this, Emitter.sources.USER), 100);
            });
        });
        this.emitter.on(Emitter.events.EDITOR_CHANGE, function (type, delta) {
            if (type === Emitter.events.TEXT_CHANGE && delta.length() > 0) {
                _this.update(Emitter.sources.SILENT);
            }
        });
        this.emitter.on(Emitter.events.SCROLL_BEFORE_UPDATE, function () {
            var native = _this.getNativeRange();
            if (native == null)
                return;
            if (native.start.node === _this.cursor.textNode)
                return; // cursor.restore() will handle
            // TODO unclear if this has negative side effects
            _this.emitter.once(Emitter.events.SCROLL_UPDATE, function () {
                try {
                    _this.setNativeRange(native.start.node, native.start.offset, native.end.node, native.end.offset);
                }
                catch (ignored) { }
            });
        });
        this.update(Emitter.sources.SILENT);
    }
    Selection.prototype.focus = function () {
        if (this.hasFocus())
            return;
        this.root.focus();
        this.setRange(this.savedRange);
    };
    Selection.prototype.format = function (format, value) {
        if (this.scroll.whitelist != null && !this.scroll.whitelist[format])
            return;
        this.scroll.update();
        var nativeRange = this.getNativeRange();
        if (nativeRange == null || !nativeRange.native.collapsed || Parchment.query(format, Parchment.Scope.BLOCK))
            return;
        if (nativeRange.start.node !== this.cursor.textNode) {
            var blot = Parchment.find(nativeRange.start.node, false);
            if (blot == null)
                return;
            // TODO Give blot ability to not split
            if (blot instanceof Parchment.Leaf) {
                var after = blot.split(nativeRange.start.offset);
                blot.parent.insertBefore(this.cursor, after);
            }
            else {
                blot.insertBefore(this.cursor, nativeRange.start.node); // Should never happen
            }
            this.cursor.attach();
        }
        this.cursor.format(format, value);
        this.scroll.optimize();
        this.setNativeRange(this.cursor.textNode, this.cursor.textNode.data.length);
        this.update();
    };
    Selection.prototype.getBounds = function (index, length) {
        if (length === void 0) { length = 0; }
        var scrollLength = this.scroll.length();
        index = Math.min(index, scrollLength - 1);
        length = Math.min(index + length, scrollLength - 1) - index;
        var bounds, node, _a = this.scroll.leaf(index), leaf = _a[0], offset = _a[1];
        if (leaf == null)
            return null;
        _b = leaf.position(offset, true), node = _b[0], offset = _b[1];
        var range = document.createRange();
        if (length > 0) {
            range.setStart(node, offset);
            _c = this.scroll.leaf(index + length), leaf = _c[0], offset = _c[1];
            if (leaf == null)
                return null;
            _d = leaf.position(offset, true), node = _d[0], offset = _d[1];
            range.setEnd(node, offset);
            bounds = range.getBoundingClientRect();
        }
        else {
            var side = 'left';
            var rect = void 0;
            if (node instanceof Text) {
                if (offset < node.data.length) {
                    range.setStart(node, offset);
                    range.setEnd(node, offset + 1);
                }
                else {
                    range.setStart(node, offset - 1);
                    range.setEnd(node, offset);
                    side = 'right';
                }
                rect = range.getBoundingClientRect();
            }
            else {
                rect = leaf.domNode.getBoundingClientRect();
                if (offset > 0)
                    side = 'right';
            }
            bounds = {
                height: rect.height,
                left: rect[side],
                width: 0,
                top: rect.top
            };
        }
        var containerBounds = this.root.parentNode.getBoundingClientRect();
        return {
            left: bounds.left - containerBounds.left,
            right: bounds.left + bounds.width - containerBounds.left,
            top: bounds.top - containerBounds.top,
            bottom: bounds.top + bounds.height - containerBounds.top,
            height: bounds.height,
            width: bounds.width
        };
        var _b, _c, _d;
    };
    Selection.prototype.getNativeRange = function () {
        var selection = document.getSelection();
        if (selection == null || selection.rangeCount <= 0)
            return null;
        var nativeRange = selection.getRangeAt(0);
        if (nativeRange == null)
            return null;
        if (!contains(this.root, nativeRange.startContainer) ||
            (!nativeRange.collapsed && !contains(this.root, nativeRange.endContainer))) {
            return null;
        }
        var range = {
            start: { node: nativeRange.startContainer, offset: nativeRange.startOffset },
            end: { node: nativeRange.endContainer, offset: nativeRange.endOffset },
            native: nativeRange
        };
        [range.start, range.end].forEach(function (position) {
            var node = position.node, offset = position.offset;
            while (!(node instanceof Text) && node.childNodes.length > 0) {
                if (node.childNodes.length > offset) {
                    node = node.childNodes[offset];
                    offset = 0;
                }
                else if (node.childNodes.length === offset) {
                    node = node.lastChild;
                    offset = node instanceof Text ? node.data.length : node.childNodes.length + 1;
                }
                else {
                    break;
                }
            }
            position.node = node, position.offset = offset;
        });
        // debug.info('getNativeRange', range);
        return range;
    };
    Selection.prototype.getRange = function () {
        var _this = this;
        var range = this.getNativeRange();
        if (range == null)
            return [null, null];
        var positions = [[range.start.node, range.start.offset]];
        if (!range.native.collapsed) {
            positions.push([range.end.node, range.end.offset]);
        }
        var indexes = positions.map(function (position) {
            var node = position[0], offset = position[1];
            var blot = Parchment.find(node, true);
            var index = blot.offset(_this.scroll);
            if (offset === 0) {
                return index;
            }
            else if (blot instanceof Parchment.ContainerBlot) {
                return index + blot.length();
            }
            else {
                return index + blot.index(node, offset);
            }
        });
        var start = Math.min.apply(Math, indexes), end = Math.max.apply(Math, indexes);
        end = Math.min(end, this.scroll.length() - 1);
        return [new Range(start, end - start), range];
    };
    Selection.prototype.hasFocus = function () {
        return document.activeElement === this.root;
    };
    Selection.prototype.scrollIntoView = function (range) {
        if (range === void 0) { range = this.lastRange; }
        if (range == null)
            return;
        var bounds = this.getBounds(range.index, range.length);
        if (bounds == null)
            return;
        if (this.root.offsetHeight < bounds.bottom) {
            var line = this.scroll.line(Math.min(range.index + range.length, this.scroll.length() - 1))[0];
            this.root.scrollTop = line.domNode.offsetTop + line.domNode.offsetHeight - this.root.offsetHeight;
        }
        else if (bounds.top < 0) {
            var line = this.scroll.line(Math.min(range.index, this.scroll.length() - 1))[0];
            this.root.scrollTop = line.domNode.offsetTop;
        }
    };
    Selection.prototype.setNativeRange = function (startNode, startOffset, endNode, endOffset, force) {
        if (endNode === void 0) { endNode = startNode; }
        if (endOffset === void 0) { endOffset = startOffset; }
        if (force === void 0) { force = false; }
        // debug.info('setNativeRange', startNode, startOffset, endNode, endOffset);
        if (startNode != null && (this.root.parentNode == null || startNode.parentNode == null || endNode.parentNode == null)) {
            return;
        }
        var selection = document.getSelection();
        if (selection == null)
            return;
        if (startNode != null) {
            if (!this.hasFocus())
                this.root.focus();
            var native = (this.getNativeRange() || {}).native;
            if (native == null || force ||
                startNode !== native.startContainer || startOffset !== native.startOffset ||
                endNode !== native.endContainer || endOffset !== native.endOffset) {
                var range = document.createRange();
                range.setStart(startNode, startOffset);
                range.setEnd(endNode, endOffset);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
        else {
            selection.removeAllRanges();
            this.root.blur();
            document.body.focus(); // root.blur() not enough on IE11+Travis+SauceLabs (but not local VMs)
        }
    };
    Selection.prototype.setRange = function (range, force, source) {
        var _this = this;
        if (force === void 0) { force = false; }
        if (source === void 0) { source = Emitter.sources.API; }
        if (typeof force === 'string') {
            source = force;
            force = false;
        }
        // debug.info('setRange', range);
        if (range != null) {
            var indexes = range.collapsed ? [range.index] : [range.index, range.index + range.length];
            var args_1 = [];
            var scrollLength_1 = this.scroll.length();
            indexes.forEach(function (index, i) {
                index = Math.min(scrollLength_1 - 1, index);
                var node, _a = _this.scroll.leaf(index), leaf = _a[0], offset = _a[1];
                _b = leaf.position(offset, i !== 0), node = _b[0], offset = _b[1];
                args_1.push(node, offset);
                var _b;
            });
            if (args_1.length < 2) {
                args_1 = args_1.concat(args_1);
            }
            this.setNativeRange.apply(this, args_1.concat([force]));
        }
        else {
            this.setNativeRange(null);
        }
        this.update(source);
    };
    Selection.prototype.update = function (source) {
        if (source === void 0) { source = Emitter.sources.USER; }
        var nativeRange, oldRange = this.lastRange;
        _a = this.getRange(), this.lastRange = _a[0], nativeRange = _a[1];
        if (this.lastRange != null) {
            this.savedRange = this.lastRange;
        }
        if (!equal(oldRange, this.lastRange)) {
            if (!this.composing && nativeRange != null && nativeRange.native.collapsed && nativeRange.start.node !== this.cursor.textNode) {
                this.cursor.restore();
            }
            var args = [Emitter.events.SELECTION_CHANGE, clone(this.lastRange), clone(oldRange), source];
            (_b = this.emitter).emit.apply(_b, [Emitter.events.EDITOR_CHANGE].concat(args));
            if (source !== Emitter.sources.SILENT) {
                (_c = this.emitter).emit.apply(_c, args);
            }
        }
        var _a, _b, _c;
    };
    return Selection;
}());
function contains(parent, descendant) {
    try {
        // Firefox inserts inaccessible nodes around video elements
        descendant.parentNode;
    }
    catch (e) {
        return false;
    }
    // IE11 has bug with Text nodes
    // https://connect.microsoft.com/IE/feedback/details/780874/node-contains-is-incorrect
    if (descendant instanceof Text) {
        descendant = descendant.parentNode;
    }
    return parent.contains(descendant);
}
// export { Range, Selection as default }; 
var Theme = (function () {
    function Theme(quill, options) {
        this.quill = quill;
        this.options = options;
        // this.quill = quill;
        // this.options = options;
        this.modules = {};
    }
    Theme.prototype.init = function () {
        var _this = this;
        Object.keys(this.options.modules).forEach(function (name) {
            if (_this.modules[name] == null) {
                _this.addModule(name);
            }
        });
    };
    Theme.prototype.addModule = function (name) {
        var moduleClass = this.quill.constructor.import("modules/" + name);
        this.modules[name] = new moduleClass(this.quill, this.options.modules[name] || {});
        return this.modules[name];
    };
    return Theme;
}());
Theme.DEFAULTS = {
    modules: {}
};
Theme.themes = {
    'default': Theme
};
// export default Theme; 
// import './polyfill';
// import Delta from 'quill-delta';
///<reference path='./editor.ts' />
// import Editor from './editor';
///<reference path='./emitter.ts' />
// import Emitter from './emitter';
///<reference path='./module.ts' />
// import Module from './module';
// import Parchment from 'parchment';
///<reference path='./selection.ts' />
// import Selection, { Range } from './selection';
// import extend from 'extend';
// import logger from './logger';
///<reference path='./theme.ts' />
// import Theme from './theme';
// let debug = logger('quill');
var Quill = (function () {
    function Quill(container, options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        this.options = expandConfig(container, options);
        this.container = this.options.container;
        if (this.container == null) {
            return debug.error('Invalid Quill container', container);
        }
        if (this.options.debug) {
            Quill.debug(this.options.debug);
        }
        var html = this.container.innerHTML.trim();
        this.container.classList.add('ql-container');
        this.container.innerHTML = '';
        this.root = this.addContainer('ql-editor');
        this.emitter = new Emitter();
        this.scroll = Parchment.create(this.root, {
            emitter: this.emitter,
            whitelist: this.options.formats
        });
        this.editor = new Editor(this.scroll);
        this.selection = new Selection(this.scroll, this.emitter);
        this.theme = new this.options.theme(this, this.options);
        this.keyboard = this.theme.addModule('keyboard');
        this.clipboard = this.theme.addModule('clipboard');
        this.history = this.theme.addModule('history');
        this.theme.init();
        this.emitter.on(Emitter.events.EDITOR_CHANGE, function (type) {
            if (type === Emitter.events.TEXT_CHANGE) {
                _this.root.classList.toggle('ql-blank', _this.editor.isBlank());
            }
        });
        this.emitter.on(Emitter.events.SCROLL_UPDATE, function (source, mutations) {
            var range = _this.selection.lastRange;
            var index = range && range.length === 0 ? range.index : undefined;
            modify.call(_this, function () {
                return _this.editor.update(null, mutations, index);
            }, source);
        });
        var contents = this.clipboard.convert("<div class='ql-editor' style=\"white-space: normal;\">" + html + "<p><br></p></div>");
        this.setContents(contents);
        this.history.clear();
        if (this.options.placeholder) {
            this.root.setAttribute('data-placeholder', this.options.placeholder);
        }
        if (this.options.readOnly) {
            this.disable();
        }
    }
    Quill.debug = function (limit) {
        // logger.level(limit);
    };
    Quill.import = function (name) {
        if (this.imports[name] == null) {
        }
        return this.imports[name];
    };
    Quill.register = function (path, target, overwrite) {
        var _this = this;
        if (overwrite === void 0) { overwrite = false; }
        if (typeof path !== 'string') {
            var name_1 = path.attrName || path.blotName;
            if (typeof name_1 === 'string') {
                // register(Blot | Attributor, overwrite)
                this.register('formats/' + name_1, path, target);
            }
            else {
                Object.keys(path).forEach(function (key) {
                    _this.register(key, path[key], target);
                });
            }
        }
        else {
            if (this.imports[path] != null && !overwrite) {
                debug.warn("Overwriting " + path + " with", target);
            }
            this.imports[path] = target;
            if ((path.startsWith('blots/') || path.startsWith('formats/')) &&
                target.blotName !== 'abstract') {
                Parchment.register(target);
            }
        }
    };
    Quill.prototype.addContainer = function (container, refNode) {
        if (refNode === void 0) { refNode = null; }
        if (typeof container === 'string') {
            var className = container;
            container = document.createElement('div');
            container.classList.add(className);
        }
        this.container.insertBefore(container, refNode);
        return container;
    };
    Quill.prototype.blur = function () {
        this.selection.setRange(null);
    };
    Quill.prototype.deleteText = function (index, length, source) {
        var _this = this;
        _a = overload(index, length, source), index = _a[0], length = _a[1], source = _a[3];
        return modify.call(this, function () {
            return _this.editor.deleteText(index, length);
        }, source, index, -1 * length);
        var _a;
    };
    Quill.prototype.disable = function () {
        this.enable(false);
    };
    Quill.prototype.enable = function (enabled) {
        if (enabled === void 0) { enabled = true; }
        this.scroll.enable(enabled);
        this.container.classList.toggle('ql-disabled', !enabled);
        if (!enabled) {
            this.blur();
        }
    };
    Quill.prototype.focus = function () {
        this.selection.focus();
        this.selection.scrollIntoView();
    };
    Quill.prototype.format = function (name, value, source) {
        var _this = this;
        if (source === void 0) { source = Emitter.sources.API; }
        return modify.call(this, function () {
            var range = _this.getSelection(true);
            var change = new Delta();
            if (range == null) {
                return change;
            }
            else if (Parchment.query(name, Parchment.Scope.BLOCK)) {
                change = _this.editor.formatLine(range.index, range.length, (_a = {}, _a[name] = value, _a));
            }
            else if (range.length === 0) {
                _this.selection.format(name, value);
                return change;
            }
            else {
                change = _this.editor.formatText(range.index, range.length, (_b = {}, _b[name] = value, _b));
            }
            _this.setSelection(range, Emitter.sources.SILENT);
            return change;
            var _a, _b;
        }, source);
    };
    Quill.prototype.formatLine = function (index, length, name, value, source) {
        var _this = this;
        var formats;
        _a = overload(index, length, name, value, source), index = _a[0], length = _a[1], formats = _a[2], source = _a[3];
        return modify.call(this, function () {
            return _this.editor.formatLine(index, length, formats);
        }, source, index, 0);
        var _a;
    };
    Quill.prototype.formatText = function (index, length, name, value, source) {
        var _this = this;
        var formats;
        _a = overload(index, length, name, value, source), index = _a[0], length = _a[1], formats = _a[2], source = _a[3];
        return modify.call(this, function () {
            return _this.editor.formatText(index, length, formats);
        }, source, index, 0);
        var _a;
    };
    Quill.prototype.getBounds = function (index, length) {
        if (length === void 0) { length = 0; }
        if (typeof index === 'number') {
            return this.selection.getBounds(index, length);
        }
        else {
            return this.selection.getBounds(index.index, index.length);
        }
    };
    Quill.prototype.getContents = function (index, length) {
        if (index === void 0) { index = 0; }
        if (length === void 0) { length = this.getLength() - index; }
        _a = overload(index, length), index = _a[0], length = _a[1];
        return this.editor.getContents(index, length);
        var _a;
    };
    Quill.prototype.getFormat = function (index, length) {
        if (index === void 0) { index = this.getSelection(); }
        if (length === void 0) { length = 0; }
        if (typeof index === 'number') {
            return this.editor.getFormat(index, length);
        }
        else {
            return this.editor.getFormat(index.index, index.length);
        }
    };
    Quill.prototype.getLength = function () {
        return this.scroll.length();
    };
    Quill.prototype.getModule = function (name) {
        return this.theme.modules[name];
    };
    Quill.prototype.getSelection = function (focus) {
        if (focus === void 0) { focus = false; }
        if (focus)
            this.focus();
        this.update(); // Make sure we access getRange with editor in consistent state
        return this.selection.getRange()[0];
    };
    Quill.prototype.getText = function (index, length) {
        if (index === void 0) { index = 0; }
        if (length === void 0) { length = this.getLength() - index; }
        _a = overload(index, length), index = _a[0], length = _a[1];
        return this.editor.getText(index, length);
        var _a;
    };
    Quill.prototype.hasFocus = function () {
        return this.selection.hasFocus();
    };
    Quill.prototype.insertEmbed = function (index, embed, value, source) {
        var _this = this;
        if (source === void 0) { source = Quill.sources.API; }
        return modify.call(this, function () {
            return _this.editor.insertEmbed(index, embed, value);
        }, source, index);
    };
    Quill.prototype.insertText = function (index, text, name, value, source) {
        var _this = this;
        var formats;
        _a = overload(index, 0, name, value, source), index = _a[0], formats = _a[2], source = _a[3];
        return modify.call(this, function () {
            return _this.editor.insertText(index, text, formats);
        }, source, index, text.length);
        var _a;
    };
    Quill.prototype.isEnabled = function () {
        return !this.container.classList.contains('ql-disabled');
    };
    Quill.prototype.off = function () {
        return this.emitter.off.apply(this.emitter, arguments);
    };
    Quill.prototype.on = function () {
        return this.emitter.on.apply(this.emitter, arguments);
    };
    Quill.prototype.once = function () {
        return this.emitter.once.apply(this.emitter, arguments);
    };
    Quill.prototype.pasteHTML = function (index, html, source) {
        this.clipboard.dangerouslyPasteHTML(index, html, source);
    };
    Quill.prototype.removeFormat = function (index, length, source) {
        var _this = this;
        _a = overload(index, length, source), index = _a[0], length = _a[1], source = _a[3];
        return modify.call(this, function () {
            return _this.editor.removeFormat(index, length);
        }, source, index);
        var _a;
    };
    Quill.prototype.setContents = function (delta, source) {
        var _this = this;
        if (source === void 0) { source = Emitter.sources.API; }
        return modify.call(this, function () {
            delta = new Delta(delta).slice();
            var lastOp = delta.ops[delta.ops.length - 1];
            // Quill contents must always end with newline
            if (lastOp == null || lastOp.insert[lastOp.insert.length - 1] !== '\n') {
                delta.insert('\n');
            }
            delta.delete(_this.getLength());
            return _this.editor.applyDelta(delta);
        }, source);
    };
    Quill.prototype.setSelection = function (index, length, source) {
        if (index == null) {
            this.selection.setRange(null, length || Quill.sources.API);
        }
        else {
            _a = overload(index, length, source), index = _a[0], length = _a[1], source = _a[3];
            this.selection.setRange(new Range(index, length), source);
        }
        this.selection.scrollIntoView();
        var _a;
    };
    Quill.prototype.setText = function (text, source) {
        if (source === void 0) { source = Emitter.sources.API; }
        var delta = new Delta().insert(text);
        return this.setContents(delta, source);
    };
    Quill.prototype.update = function (source) {
        if (source === void 0) { source = Emitter.sources.USER; }
        var change = this.scroll.update(source); // Will update selection before selection.update() does if text changes
        this.selection.update(source);
        return change;
    };
    Quill.prototype.updateContents = function (delta, source) {
        var _this = this;
        if (source === void 0) { source = Emitter.sources.API; }
        return modify.call(this, function () {
            if (Array.isArray(delta)) {
                delta = new Delta(delta.slice());
            }
            return _this.editor.applyDelta(delta, source);
        }, source, true);
    };
    return Quill;
}());
Quill.DEFAULTS = {
    bounds: null,
    formats: null,
    modules: {},
    placeholder: '',
    readOnly: false,
    strict: true,
    theme: 'default'
};
Quill.events = Emitter.events;
Quill.sources = Emitter.sources;
// eslint-disable-next-line no-undef
Quill.version = typeof (QUILL_VERSION) === 'undefined' ? 'dev' : QUILL_VERSION;
Quill.imports = {
    'delta': Delta,
    //'parchment'   : Parchment,
    'core/module': Module,
    'core/theme': Theme
};
function expandConfig(container, userConfig) {
    userConfig = extend(true, {
        container: container,
        modules: {
            clipboard: true,
            keyboard: true,
            history: true
        }
    }, userConfig);
    if (!userConfig.theme || userConfig.theme === Quill.DEFAULTS.theme) {
        userConfig.theme = Theme;
    }
    else {
        userConfig.theme = Quill.import("themes/" + userConfig.theme);
        if (userConfig.theme == null) {
            throw new Error("Invalid theme " + userConfig.theme + ". Did you register it?");
        }
    }
    var themeConfig = extend(true, {}, userConfig.theme.DEFAULTS);
    [themeConfig, userConfig].forEach(function (config) {
        config.modules = config.modules || {};
        Object.keys(config.modules).forEach(function (module) {
            if (config.modules[module] === true) {
                config.modules[module] = {};
            }
        });
    });
    var moduleNames = Object.keys(themeConfig.modules).concat(Object.keys(userConfig.modules));
    var moduleConfig = moduleNames.reduce(function (config, name) {
        var moduleClass = Quill.import("modules/" + name);
        if (moduleClass == null) {
            debug.error("Cannot load " + name + " module. Are you sure you registered it?");
        }
        else {
            config[name] = moduleClass.DEFAULTS || {};
        }
        return config;
    }, {});
    // Special case toolbar shorthand
    if (userConfig.modules != null && userConfig.modules.toolbar &&
        userConfig.modules.toolbar.constructor !== Object) {
        userConfig.modules.toolbar = {
            container: userConfig.modules.toolbar
        };
    }
    userConfig = extend(true, {}, Quill.DEFAULTS, { modules: moduleConfig }, themeConfig, userConfig);
    ['bounds', 'container'].forEach(function (key) {
        if (typeof userConfig[key] === 'string') {
            userConfig[key] = document.querySelector(userConfig[key]);
        }
    });
    userConfig.modules = Object.keys(userConfig.modules).reduce(function (config, name) {
        if (userConfig.modules[name]) {
            config[name] = userConfig.modules[name];
        }
        return config;
    }, {});
    return userConfig;
}
// Handle selection preservation and TEXT_CHANGE emission
// common to modification APIs
function modify(modifier, source, index, shift) {
    if (!this.options.strict && !this.isEnabled() && source === Emitter.sources.USER) {
        return new Delta();
    }
    var range = index == null ? null : this.getSelection();
    var oldDelta = this.editor.delta;
    var change = modifier();
    if (range != null) {
        if (index === true)
            index = range.index;
        if (shift == null) {
            range = shiftRange(range, change, source);
        }
        else if (shift !== 0) {
            range = shiftRange(range, index, shift, source);
        }
        this.setSelection(range, Emitter.sources.SILENT);
    }
    if (change.length() > 0) {
        var args = [Emitter.events.TEXT_CHANGE, change, oldDelta, source];
        (_a = this.emitter).emit.apply(_a, [Emitter.events.EDITOR_CHANGE].concat(args));
        if (source !== Emitter.sources.SILENT) {
            (_b = this.emitter).emit.apply(_b, args);
        }
    }
    return change;
    var _a, _b;
}
function overload(index, length, name, value, source) {
    var formats = {};
    if (typeof index.index === 'number' && typeof index.length === 'number') {
        // Allow for throwaway end (used by insertText/insertEmbed)
        if (typeof length !== 'number') {
            source = value, value = name, name = length, length = index.length, index = index.index;
        }
        else {
            length = index.length, index = index.index;
        }
    }
    else if (typeof length !== 'number') {
        source = value, value = name, name = length, length = 0;
    }
    // Handle format being object, two format name/value strings or excluded
    if (typeof name === 'object') {
        formats = name;
        source = value;
    }
    else if (typeof name === 'string') {
        if (value != null) {
            formats[name] = value;
        }
        else {
            source = name;
        }
    }
    // Handle optional source
    source = source || Emitter.sources.API;
    return [index, length, formats, source];
}
function shiftRange(range, index, length, source) {
    if (range == null)
        return null;
    var start, end;
    if (index instanceof Delta) {
        _a = [range.index, range.index + range.length].map(function (pos) {
            return index.transformPosition(pos, source === Emitter.sources.USER);
        }), start = _a[0], end = _a[1];
    }
    else {
        _b = [range.index, range.index + range.length].map(function (pos) {
            if (pos < index || (pos === index && source !== Emitter.sources.USER))
                return pos;
            if (length >= 0) {
                return pos + length;
            }
            else {
                return Math.max(index, pos + length);
            }
        }), start = _b[0], end = _b[1];
    }
    return new Range(start, end - start);
    var _a, _b;
}
// export { expandConfig, overload, Quill as default }; 
// import Parchment from 'parchment';
var _config = {
    scope: Parchment.Scope.BLOCK,
    whitelist: ['right', 'center', 'justify']
};
var AlignAttribute = new Parchment.Attributor('align', 'align', _config);
var AlignClass = new Parchment.ClassAttributor('align', 'ql-align', _config);
var AlignStyle = new Parchment.StyleAttributor('align', 'text-align', _config);
// export { AlignAttribute, AlignClass, AlignStyle }; 
// import Parchment from 'parchment';
var ColorAttributor = (function (_super) {
    __extends(ColorAttributor, _super);
    function ColorAttributor() {
        return _super.apply(this, arguments) || this;
    }
    ColorAttributor.prototype.value = function (domNode) {
        var value = _super.prototype.value.call(this, domNode);
        if (!value.startsWith('rgb('))
            return value;
        value = value.replace(/^[^\d]+/, '').replace(/[^\d]+$/, '');
        return '#' + value.split(',').map(function (component) {
            return ('00' + parseInt(component).toString(16)).slice(-2);
        }).join('');
    };
    return ColorAttributor;
}(Parchment.StyleAttributor));
var ColorClass = new Parchment.ClassAttributor('color', 'ql-color', {
    scope: Parchment.Scope.INLINE
});
var ColorStyle = new ColorAttributor('color', 'color', {
    scope: Parchment.Scope.INLINE
});
// export { ColorAttributor, ColorClass, ColorStyle }; 
//import Parchment from 'parchment';
///<reference path='./color.ts' />
//import { ColorAttributor } from './color';
var BackgroundClass = new Parchment.ClassAttributor('background', 'ql-bg', {
    scope: Parchment.Scope.INLINE
});
var BackgroundStyle = new ColorAttributor('background', 'background-color', {
    scope: Parchment.Scope.INLINE
});
//export { BackgroundClass, BackgroundStyle }; 
// import Parchment from 'parchment';
var config = {
    scope: Parchment.Scope.BLOCK,
    whitelist: ['rtl']
};
var DirectionAttribute = new Parchment.Attributor('direction', 'dir', config);
var DirectionClass = new Parchment.ClassAttributor('direction', 'ql-direction', config);
var DirectionStyle = new Parchment.StyleAttributor('direction', 'direction', config);
// export { DirectionAttribute, DirectionClass, DirectionStyle }; 
// import Parchment from 'parchment';
var font_config = {
    scope: Parchment.Scope.INLINE,
    whitelist: ['serif', 'monospace']
};
var FontClass = new Parchment.ClassAttributor('font', 'ql-font', font_config);
var FontStyleAttributor = (function (_super) {
    __extends(FontStyleAttributor, _super);
    function FontStyleAttributor() {
        return _super.apply(this, arguments) || this;
    }
    FontStyleAttributor.prototype.value = function (node) {
        return _super.prototype.value.call(this, node).replace(/["']/g, '');
    };
    return FontStyleAttributor;
}(Parchment.StyleAttributor));
var FontStyle = new FontStyleAttributor('font', 'font-family', font_config);
// export { FontStyle, FontClass }; 
// import Parchment from 'parchment';
var SizeClass = new Parchment.ClassAttributor('size', 'ql-size', {
    scope: Parchment.Scope.INLINE,
    whitelist: ['small', 'large', 'huge']
});
var SizeStyle = new Parchment.StyleAttributor('size', 'font-size', {
    scope: Parchment.Scope.INLINE,
    whitelist: ['10px', '18px', '32px']
});
// export { SizeClass, SizeStyle }; 
//import Delta from 'quill-delta';
//import Parchment from 'parchment';
//import Quill from '../core/quill';
//import logger from '../core/logger';
///<reference path='../core/module.ts' />
//import Module from '../core/module';
///<reference path='../formats/align.ts' />
//import { AlignAttribute, AlignStyle } from '../formats/align';
///<reference path='../formats/background.ts' />
//import { BackgroundStyle } from '../formats/background';
///<reference path='../formats/color.ts' />
//import { ColorStyle } from '../formats/color';
///<reference path='../formats/direction.ts' />
//import { DirectionAttribute, DirectionStyle } from '../formats/direction';
///<reference path='../formats/font.ts' />
//import { FontStyle } from '../formats/font';
///<reference path='../formats/size.ts' />
//import { SizeStyle } from '../formats/size';
// let debug = logger('quill:clipboard');
var DOM_KEY = '__ql-matcher';
var CLIPBOARD_CONFIG = [
    [Node.TEXT_NODE, matchText],
    ['br', matchBreak],
    [Node.ELEMENT_NODE, matchNewline],
    [Node.ELEMENT_NODE, matchBlot],
    [Node.ELEMENT_NODE, matchSpacing],
    [Node.ELEMENT_NODE, matchAttributor],
    [Node.ELEMENT_NODE, matchStyles],
    ['b', matchAlias.bind(matchAlias, 'bold')],
    ['i', matchAlias.bind(matchAlias, 'italic')],
    ['style', matchIgnore]
];
var ATTRIBUTE_ATTRIBUTORS = [
    AlignAttribute,
    DirectionAttribute
].reduce(function (memo, attr) {
    memo[attr.keyName] = attr;
    return memo;
}, {});
var STYLE_ATTRIBUTORS = [
    AlignStyle,
    BackgroundStyle,
    ColorStyle,
    DirectionStyle,
    FontStyle,
    SizeStyle
].reduce(function (memo, attr) {
    memo[attr.keyName] = attr;
    return memo;
}, {});
var Clipboard = (function (_super) {
    __extends(Clipboard, _super);
    function Clipboard(quill, options) {
        var _this = _super.call(this, quill, options) || this;
        _this.quill.root.addEventListener('paste', _this.onPaste.bind(_this));
        _this.container = _this.quill.addContainer('ql-clipboard');
        _this.container.setAttribute('contenteditable', true);
        _this.container.setAttribute('tabindex', -1);
        _this.matchers = [];
        CLIPBOARD_CONFIG.concat(_this.options.matchers).forEach(function (pair) {
            _this.addMatcher.apply(_this, pair);
        });
        return _this;
    }
    Clipboard.prototype.addMatcher = function (selector, matcher) {
        this.matchers.push([selector, matcher]);
    };
    Clipboard.prototype.convert = function (html) {
        if (typeof html === 'string') {
            this.container.innerHTML = html;
        }
        var _a = this.prepareMatching(), elementMatchers = _a[0], textMatchers = _a[1];
        var delta = traverse(this.container, elementMatchers, textMatchers);
        // Remove trailing newline
        if (deltaEndsWith(delta, '\n') && delta.ops[delta.ops.length - 1].attributes == null) {
            delta = delta.compose(new Delta().retain(delta.length() - 1).delete(1));
        }
        // debug.log('convert', this.container.innerHTML, delta);
        this.container.innerHTML = '';
        return delta;
    };
    Clipboard.prototype.dangerouslyPasteHTML = function (index, html, source) {
        if (source === void 0) { source = Quill.sources.API; }
        if (typeof index === 'string') {
            return this.quill.setContents(this.convert(index), html);
        }
        else {
            var paste = this.convert(html);
            return this.quill.updateContents(new Delta().retain(index).concat(paste), source);
        }
    };
    Clipboard.prototype.onPaste = function (e) {
        var _this = this;
        if (e.defaultPrevented || !this.quill.isEnabled())
            return;
        var range = this.quill.getSelection();
        var delta = new Delta().retain(range.index);
        var scrollTop = this.quill.scrollingContainer.scrollTop;
        this.container.focus();
        setTimeout(function () {
            _this.quill.selection.update(Quill.sources.SILENT);
            delta = delta.concat(_this.convert()).delete(range.length);
            _this.quill.updateContents(delta, Quill.sources.USER);
            // range.length contributes to delta.length()
            _this.quill.setSelection(delta.length() - range.length, Quill.sources.SILENT);
            _this.quill.scrollingContainer.scrollTop = scrollTop;
            _this.quill.selection.scrollIntoView();
        }, 1);
    };
    Clipboard.prototype.prepareMatching = function () {
        var _this = this;
        var elementMatchers = [], textMatchers = [];
        this.matchers.forEach(function (pair) {
            var selector = pair[0], matcher = pair[1];
            switch (selector) {
                case Node.TEXT_NODE:
                    textMatchers.push(matcher);
                    break;
                case Node.ELEMENT_NODE:
                    elementMatchers.push(matcher);
                    break;
                default:
                    [].forEach.call(_this.container.querySelectorAll(selector), function (node) {
                        // TODO use weakmap
                        node[DOM_KEY] = node[DOM_KEY] || [];
                        node[DOM_KEY].push(matcher);
                    });
                    break;
            }
        });
        return [elementMatchers, textMatchers];
    };
    return Clipboard;
}(Module));
Clipboard.DEFAULTS = {
    matchers: []
};
function computeStyle(node) {
    if (node.nodeType !== Node.ELEMENT_NODE)
        return {};
    var DOM_KEY = '__ql-computed-style';
    return node[DOM_KEY] || (node[DOM_KEY] = window.getComputedStyle(node));
}
function deltaEndsWith(delta, text) {
    var endText = "";
    for (var i = delta.ops.length - 1; i >= 0 && endText.length < text.length; --i) {
        var op = delta.ops[i];
        if (typeof op.insert !== 'string')
            break;
        endText = op.insert + endText;
    }
    return endText.slice(-1 * text.length) === text;
}
function isLine(node) {
    if (node.childNodes.length === 0)
        return false; // Exclude embed blocks
    var style = computeStyle(node);
    return ['block', 'list-item'].indexOf(style.display) > -1;
}
function traverse(node, elementMatchers, textMatchers) {
    if (node.nodeType === node.TEXT_NODE) {
        return textMatchers.reduce(function (delta, matcher) {
            return matcher(node, delta);
        }, new Delta());
    }
    else if (node.nodeType === node.ELEMENT_NODE) {
        return [].reduce.call(node.childNodes || [], function (delta, childNode) {
            var childrenDelta = traverse(childNode, elementMatchers, textMatchers);
            if (childNode.nodeType === node.ELEMENT_NODE) {
                childrenDelta = elementMatchers.reduce(function (childrenDelta, matcher) {
                    return matcher(childNode, childrenDelta);
                }, childrenDelta);
                childrenDelta = (childNode[DOM_KEY] || []).reduce(function (childrenDelta, matcher) {
                    return matcher(childNode, childrenDelta);
                }, childrenDelta);
            }
            return delta.concat(childrenDelta);
        }, new Delta());
    }
    else {
        return new Delta();
    }
}
function matchAlias(format, node, delta) {
    return delta.compose(new Delta().retain(delta.length(), (_a = {}, _a[format] = true, _a)));
    var _a;
}
function matchAttributor(node, delta) {
    var attributes = Parchment.Attributor.keys(node);
    var classes = Parchment.ClassAttributor.keys(node);
    var styles = Parchment.StyleAttributor.keys(node);
    var formats = {};
    attributes.concat(classes).concat(styles).forEach(function (name) {
        var attr = Parchment.query(name, Parchment.Scope.ATTRIBUTE);
        if (attr != null) {
            formats[attr.attrName] = attr.value(node);
            if (formats[attr.attrName])
                return;
        }
        if (ATTRIBUTE_ATTRIBUTORS[name] != null) {
            attr = ATTRIBUTE_ATTRIBUTORS[name];
            formats[attr.attrName] = attr.value(node);
        }
        if (STYLE_ATTRIBUTORS[name] != null) {
            attr = STYLE_ATTRIBUTORS[name];
            formats[attr.attrName] = attr.value(node);
        }
    });
    if (Object.keys(formats).length > 0) {
        delta = delta.compose(new Delta().retain(delta.length(), formats));
    }
    return delta;
}
function matchBlot(node, delta) {
    var match = Parchment.query(node);
    if (match == null)
        return delta;
    if (match.prototype instanceof Parchment.EmbedBlot) {
        var embed = {};
        var value = match.value(node);
        if (value != null) {
            embed[match.blotName] = value;
            delta = new Delta().insert(embed, match.formats(node));
        }
    }
    else if (typeof match.formats === 'function') {
        var formats = (_a = {}, _a[match.blotName] = match.formats(node), _a);
        delta = delta.compose(new Delta().retain(delta.length(), formats));
    }
    return delta;
    var _a;
}
function matchBreak(node, delta) {
    if (!deltaEndsWith(delta, '\n')) {
        delta.insert('\n');
    }
    return delta;
}
function matchIgnore() {
    return new Delta();
}
function matchNewline(node, delta) {
    if (isLine(node) && !deltaEndsWith(delta, '\n')) {
        delta.insert('\n');
    }
    return delta;
}
function matchSpacing(node, delta) {
    if (isLine(node) && node.nextElementSibling != null && !deltaEndsWith(delta, '\n\n')) {
        var nodeHeight = node.offsetHeight + parseFloat(computeStyle(node).marginTop) + parseFloat(computeStyle(node).marginBottom);
        if (node.nextElementSibling.offsetTop > node.offsetTop + nodeHeight * 1.5) {
            delta.insert('\n');
        }
    }
    return delta;
}
function matchStyles(node, delta) {
    var formats = {};
    var style = node.style || {};
    if (style.fontStyle && computeStyle(node).fontStyle === 'italic') {
        formats.italic = true;
    }
    if (style.fontWeight && computeStyle(node).fontWeight === 'bold') {
        formats.bold = true;
    }
    if (Object.keys(formats).length > 0) {
        delta = delta.compose(new Delta().retain(delta.length(), formats));
    }
    if (parseFloat(style.textIndent || 0) > 0) {
        delta = new Delta().insert('\t').concat(delta);
    }
    return delta;
}
function matchText(node, delta) {
    var text = node.data;
    // Word represents empty line with <o:p>&nbsp;</o:p>
    if (node.parentNode.tagName === 'O:P') {
        return delta.insert(text.trim());
    }
    if (!computeStyle(node.parentNode).whiteSpace.startsWith('pre')) {
        // eslint-disable-next-line func-style
        var replacer = function (collapse, match) {
            match = match.replace(/[^\u00a0]/g, ''); // \u00a0 is nbsp;
            return match.length < 1 && collapse ? ' ' : match;
        };
        text = text.replace(/\r\n/g, ' ').replace(/\n/g, ' ');
        text = text.replace(/\s\s+/g, replacer.bind(replacer, true)); // collapse whitespace
        if ((node.previousSibling == null && isLine(node.parentNode)) ||
            (node.previousSibling != null && isLine(node.previousSibling))) {
            text = text.replace(/^\s+/, replacer.bind(replacer, false));
        }
        if ((node.nextSibling == null && isLine(node.parentNode)) ||
            (node.nextSibling != null && isLine(node.nextSibling))) {
            text = text.replace(/\s+$/, replacer.bind(replacer, false));
        }
    }
    return delta.insert(text);
}
// export { Clipboard as default, matchAttributor, matchBlot, matchNewline, matchSpacing, matchText }; 
// import Parchment from 'parchment';
///<reference path='../core/quill.ts' />
// import Quill from '../core/quill';
///<reference path='../core/module.ts' />
// import Module from '../core/module';
var History = (function (_super) {
    __extends(History, _super);
    function History(quill, options) {
        var _this = _super.call(this, quill, options) || this;
        _this.lastRecorded = 0;
        _this.ignoreChange = false;
        _this.clear();
        _this.quill.on(Quill.events.EDITOR_CHANGE, function (eventName, delta, oldDelta, source) {
            if (eventName !== Quill.events.TEXT_CHANGE || _this.ignoreChange)
                return;
            if (!_this.options.userOnly || source === Quill.sources.USER) {
                _this.record(delta, oldDelta);
            }
            else {
                _this.transform(delta);
            }
        });
        _this.quill.keyboard.addBinding({ key: 'Z', shortKey: true }, _this.undo.bind(_this));
        _this.quill.keyboard.addBinding({ key: 'Z', shortKey: true, shiftKey: true }, _this.redo.bind(_this));
        if (/Win/i.test(navigator.platform)) {
            _this.quill.keyboard.addBinding({ key: 'Y', shortKey: true }, _this.redo.bind(_this));
        }
        return _this;
    }
    History.prototype.change = function (source, dest) {
        if (this.stack[source].length === 0)
            return;
        var delta = this.stack[source].pop();
        this.lastRecorded = 0;
        this.ignoreChange = true;
        this.quill.updateContents(delta[source], Quill.sources.USER);
        this.ignoreChange = false;
        var index = getLastChangeIndex(delta[source]);
        this.quill.setSelection(index);
        this.quill.selection.scrollIntoView();
        this.stack[dest].push(delta);
    };
    History.prototype.clear = function () {
        this.stack = { undo: [], redo: [] };
    };
    History.prototype.record = function (changeDelta, oldDelta) {
        if (changeDelta.ops.length === 0)
            return;
        this.stack.redo = [];
        var undoDelta = this.quill.getContents().diff(oldDelta);
        var timestamp = Date.now();
        if (this.lastRecorded + this.options.delay > timestamp && this.stack.undo.length > 0) {
            var delta = this.stack.undo.pop();
            undoDelta = undoDelta.compose(delta.undo);
            changeDelta = delta.redo.compose(changeDelta);
        }
        else {
            this.lastRecorded = timestamp;
        }
        this.stack.undo.push({
            redo: changeDelta,
            undo: undoDelta
        });
        if (this.stack.undo.length > this.options.maxStack) {
            this.stack.undo.shift();
        }
    };
    History.prototype.redo = function () {
        this.change('redo', 'undo');
    };
    History.prototype.transform = function (delta) {
        this.stack.undo.forEach(function (change) {
            change.undo = delta.transform(change.undo, true);
            change.redo = delta.transform(change.redo, true);
        });
        this.stack.redo.forEach(function (change) {
            change.undo = delta.transform(change.undo, true);
            change.redo = delta.transform(change.redo, true);
        });
    };
    History.prototype.undo = function () {
        this.change('undo', 'redo');
    };
    return History;
}(Module));
History.DEFAULTS = {
    delay: 1000,
    maxStack: 100,
    userOnly: false
};
function endsWithNewlineChange(delta) {
    var lastOp = delta.ops[delta.ops.length - 1];
    if (lastOp == null)
        return false;
    if (lastOp.insert != null) {
        return typeof lastOp.insert === 'string' && lastOp.insert.endsWith('\n');
    }
    if (lastOp.attributes != null) {
        return Object.keys(lastOp.attributes).some(function (attr) {
            return Parchment.query(attr, Parchment.Scope.BLOCK) != null;
        });
    }
    return false;
}
function getLastChangeIndex(delta) {
    var deleteLength = delta.reduce(function (length, op) {
        length += (op.delete || 0);
        return length;
    }, 0);
    var changeIndex = delta.length() - deleteLength;
    if (endsWithNewlineChange(delta)) {
        changeIndex -= 1;
    }
    return changeIndex;
}
// export { History as default, getLastChangeIndex }; 
//import clone from 'clone';
//import equal from 'deep-equal';
//import extend from 'extend';
//import DeltaOp from 'quill-delta/lib/op';
//import Parchment from 'parchment';
///<reference path='../core/quill.ts' />
//import Quill from '../core/quill';
//import logger from '../core/logger';
///<reference path='../core/module.ts' />
//import Module from '../core/module';
//let debug = logger('quill:keyboard');
var SHORTKEY = /Mac/i.test(navigator.platform) ? 'metaKey' : 'ctrlKey';
var Keyboard = (function (_super) {
    __extends(Keyboard, _super);
    function Keyboard(quill, options) {
        var _this = _super.call(this, quill, options) || this;
        _this.bindings = {};
        Object.keys(_this.options.bindings).forEach(function (name) {
            if (_this.options.bindings[name]) {
                _this.addBinding(_this.options.bindings[name]);
            }
        });
        _this.addBinding({ key: Keyboard.keys.ENTER, shiftKey: null }, handleEnter);
        _this.addBinding({ key: Keyboard.keys.ENTER, metaKey: null, ctrlKey: null, altKey: null }, function () { });
        if (/Gecko/i.test(navigator.userAgent)) {
            // Need to handle delete and backspace for Firefox in the general case #1171
            _this.addBinding({ key: Keyboard.keys.BACKSPACE }, { collapsed: true }, handleBackspace);
            _this.addBinding({ key: Keyboard.keys.DELETE }, { collapsed: true }, handleDelete);
        }
        else {
            _this.addBinding({ key: Keyboard.keys.BACKSPACE }, { collapsed: true, prefix: /^.?$/ }, handleBackspace);
            _this.addBinding({ key: Keyboard.keys.DELETE }, { collapsed: true, suffix: /^.?$/ }, handleDelete);
        }
        _this.addBinding({ key: Keyboard.keys.BACKSPACE }, { collapsed: false }, handleDeleteRange);
        _this.addBinding({ key: Keyboard.keys.DELETE }, { collapsed: false }, handleDeleteRange);
        if (/Trident/i.test(navigator.userAgent)) {
            _this.addBinding({ key: Keyboard.keys.BACKSPACE, shortKey: true }, handleBackspace);
            _this.addBinding({ key: Keyboard.keys.DELETE, shortKey: true }, handleDelete);
        }
        _this.listen();
        return _this;
    }
    Keyboard.match = function (evt, binding) {
        binding = normalize(binding);
        if (!!binding.shortKey !== evt[SHORTKEY] && binding.shortKey !== null)
            return false;
        if (['altKey', 'ctrlKey', 'metaKey', 'shiftKey'].some(function (key) {
            return (key != SHORTKEY && !!binding[key] !== evt[key] && binding[key] !== null);
        })) {
            return false;
        }
        return binding.key === (evt.which || evt.keyCode);
    };
    Keyboard.prototype.addBinding = function (key, context, handler) {
        if (context === void 0) { context = {}; }
        if (handler === void 0) { handler = {}; }
        var binding = normalize(key);
        if (binding == null || binding.key == null) {
            return debug.warn('Attempted to add invalid keyboard binding', binding);
        }
        if (typeof context === 'function') {
            context = { handler: context };
        }
        if (typeof handler === 'function') {
            handler = { handler: handler };
        }
        binding = extend(binding, context, handler);
        this.bindings[binding.key] = this.bindings[binding.key] || [];
        this.bindings[binding.key].push(binding);
    };
    Keyboard.prototype.listen = function () {
        var _this = this;
        this.quill.root.addEventListener('keydown', function (evt) {
            if (evt.defaultPrevented)
                return;
            var which = evt.which || evt.keyCode;
            var bindings = (_this.bindings[which] || []).filter(function (binding) {
                return Keyboard.match(evt, binding);
            });
            if (bindings.length === 0)
                return;
            var range = _this.quill.getSelection();
            if (range == null || !_this.quill.hasFocus())
                return;
            var _a = _this.quill.scroll.line(range.index), line = _a[0], offset = _a[1];
            var _b = _this.quill.scroll.leaf(range.index), leafStart = _b[0], offsetStart = _b[1];
            var _c = range.length === 0 ? [leafStart, offsetStart] : _this.quill.scroll.leaf(range.index + range.length), leafEnd = _c[0], offsetEnd = _c[1];
            var prefixText = leafStart instanceof Parchment.TextBlot ? leafStart.value().slice(0, offsetStart) : '';
            var suffixText = leafEnd instanceof Parchment.TextBlot ? leafEnd.value().slice(offsetEnd) : '';
            var curContext = {
                collapsed: range.length === 0,
                empty: range.length === 0 && line.length() <= 1,
                format: _this.quill.getFormat(range),
                offset: offset,
                prefix: prefixText,
                suffix: suffixText
            };
            var prevented = bindings.some(function (binding) {
                if (binding.collapsed != null && binding.collapsed !== curContext.collapsed)
                    return false;
                if (binding.empty != null && binding.empty !== curContext.empty)
                    return false;
                if (binding.offset != null && binding.offset !== curContext.offset)
                    return false;
                if (Array.isArray(binding.format)) {
                    // any format is present
                    if (binding.format.every(function (name) {
                        return curContext.format[name] == null;
                    })) {
                        return false;
                    }
                }
                else if (typeof binding.format === 'object') {
                    // all formats must match
                    if (!Object.keys(binding.format).every(function (name) {
                        if (binding.format[name] === true)
                            return curContext.format[name] != null;
                        if (binding.format[name] === false)
                            return curContext.format[name] == null;
                        return equal(binding.format[name], curContext.format[name]);
                    })) {
                        return false;
                    }
                }
                if (binding.prefix != null && !binding.prefix.test(curContext.prefix))
                    return false;
                if (binding.suffix != null && !binding.suffix.test(curContext.suffix))
                    return false;
                return binding.handler.call(_this, range, curContext) !== true;
            });
            if (prevented) {
                evt.preventDefault();
            }
        });
    };
    return Keyboard;
}(Module));
Keyboard.keys = {
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    ESCAPE: 27,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    DELETE: 46
};
Keyboard.DEFAULTS = {
    bindings: {
        'bold': makeFormatHandler('bold'),
        'italic': makeFormatHandler('italic'),
        'underline': makeFormatHandler('underline'),
        'indent': {
            // highlight tab or tab at beginning of list, indent or blockquote
            key: Keyboard.keys.TAB,
            format: ['blockquote', 'indent', 'list'],
            handler: function (range, context) {
                if (context.collapsed && context.offset !== 0)
                    return true;
                this.quill.format('indent', '+1', Quill.sources.USER);
            }
        },
        'outdent': {
            key: Keyboard.keys.TAB,
            shiftKey: true,
            format: ['blockquote', 'indent', 'list'],
            // highlight tab or tab at beginning of list, indent or blockquote
            handler: function (range, context) {
                if (context.collapsed && context.offset !== 0)
                    return true;
                this.quill.format('indent', '-1', Quill.sources.USER);
            }
        },
        'outdent backspace': {
            key: Keyboard.keys.BACKSPACE,
            collapsed: true,
            format: ['blockquote', 'indent', 'list'],
            offset: 0,
            handler: function (range, context) {
                if (context.format.indent != null) {
                    this.quill.format('indent', '-1', Quill.sources.USER);
                }
                else if (context.format.blockquote != null) {
                    this.quill.format('blockquote', false, Quill.sources.USER);
                }
                else if (context.format.list != null) {
                    this.quill.format('list', false, Quill.sources.USER);
                }
            }
        },
        'indent code-block': makeCodeBlockHandler(true),
        'outdent code-block': makeCodeBlockHandler(false),
        'remove tab': {
            key: Keyboard.keys.TAB,
            shiftKey: true,
            collapsed: true,
            prefix: /\t$/,
            handler: function (range) {
                this.quill.deleteText(range.index - 1, 1, Quill.sources.USER);
            }
        },
        'tab': {
            key: Keyboard.keys.TAB,
            handler: function (range, context) {
                if (!context.collapsed) {
                    this.quill.scroll.deleteAt(range.index, range.length);
                }
                this.quill.insertText(range.index, '\t', Quill.sources.USER);
                this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
            }
        },
        'list empty enter': {
            key: Keyboard.keys.ENTER,
            collapsed: true,
            format: ['list'],
            empty: true,
            handler: function (range, context) {
                this.quill.format('list', false, Quill.sources.USER);
                if (context.format.indent) {
                    this.quill.format('indent', false, Quill.sources.USER);
                }
            }
        },
        'checklist enter': {
            key: Keyboard.keys.ENTER,
            collapsed: true,
            format: { list: 'checked' },
            handler: function (range) {
                this.quill.scroll.insertAt(range.index, '\n');
                var line = this.quill.scroll.line(range.index + 1)[0];
                line.format('list', 'unchecked');
                this.quill.update(Quill.sources.USER);
                this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
                this.quill.selection.scrollIntoView();
            }
        },
        'header enter': {
            key: Keyboard.keys.ENTER,
            collapsed: true,
            format: ['header'],
            suffix: /^$/,
            handler: function (range) {
                this.quill.scroll.insertAt(range.index, '\n');
                this.quill.formatText(range.index + 1, 1, 'header', false, Quill.sources.USER);
                this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
                this.quill.selection.scrollIntoView();
            }
        },
        'list autofill': {
            key: ' ',
            collapsed: true,
            format: { list: false },
            prefix: /^(1\.|-)$/,
            handler: function (range, context) {
                var length = context.prefix.length;
                this.quill.scroll.deleteAt(range.index - length, length);
                this.quill.formatLine(range.index - length, 1, 'list', length === 1 ? 'bullet' : 'ordered', Quill.sources.USER);
                this.quill.setSelection(range.index - length, Quill.sources.SILENT);
            }
        }
    }
};
function handleBackspace(range, context) {
    if (range.index === 0)
        return;
    var line = this.quill.scroll.line(range.index)[0];
    var formats = {};
    if (context.offset === 0) {
        var curFormats = line.formats();
        var prevFormats = this.quill.getFormat(range.index - 1, 1);
        formats = DeltaOp.attributes.diff(curFormats, prevFormats) || {};
    }
    this.quill.deleteText(range.index - 1, 1, Quill.sources.USER);
    if (Object.keys(formats).length > 0) {
        this.quill.formatLine(range.index - 1, 1, formats, Quill.sources.USER);
    }
    this.quill.selection.scrollIntoView();
}
function handleDelete(range) {
    if (range.index >= this.quill.getLength() - 1)
        return;
    this.quill.deleteText(range.index, 1, Quill.sources.USER);
}
function handleDeleteRange(range) {
    this.quill.deleteText(range, Quill.sources.USER);
    this.quill.setSelection(range.index, Quill.sources.SILENT);
    this.quill.selection.scrollIntoView();
}
function handleEnter(range, context) {
    var _this = this;
    if (range.length > 0) {
        this.quill.scroll.deleteAt(range.index, range.length); // So we do not trigger text-change
    }
    var lineFormats = Object.keys(context.format).reduce(function (lineFormats, format) {
        if (Parchment.query(format, Parchment.Scope.BLOCK) && !Array.isArray(context.format[format])) {
            lineFormats[format] = context.format[format];
        }
        return lineFormats;
    }, {});
    this.quill.insertText(range.index, '\n', lineFormats, Quill.sources.USER);
    this.quill.selection.scrollIntoView();
    Object.keys(context.format).forEach(function (name) {
        if (lineFormats[name] != null)
            return;
        if (Array.isArray(context.format[name]))
            return;
        if (name === 'link')
            return;
        _this.quill.format(name, context.format[name], Quill.sources.USER);
    });
}
function makeCodeBlockHandler(indent) {
    return {
        key: Keyboard.keys.TAB,
        shiftKey: !indent,
        format: { 'code-block': true },
        handler: function (range) {
            var CodeBlock = Parchment.query('code-block');
            var index = range.index, length = range.length;
            var _a = this.quill.scroll.descendant(CodeBlock, index), block = _a[0], offset = _a[1];
            if (block == null)
                return;
            var scrollOffset = this.quill.scroll.offset(block);
            var start = block.newlineIndex(offset, true) + 1;
            var end = block.newlineIndex(scrollOffset + offset + length);
            var lines = block.domNode.textContent.slice(start, end).split('\n');
            offset = 0;
            lines.forEach(function (line, i) {
                if (indent) {
                    block.insertAt(start + offset, CodeBlock.TAB);
                    offset += CodeBlock.TAB.length;
                    if (i === 0) {
                        index += CodeBlock.TAB.length;
                    }
                    else {
                        length += CodeBlock.TAB.length;
                    }
                }
                else if (line.startsWith(CodeBlock.TAB)) {
                    block.deleteAt(start + offset, CodeBlock.TAB.length);
                    offset -= CodeBlock.TAB.length;
                    if (i === 0) {
                        index -= CodeBlock.TAB.length;
                    }
                    else {
                        length -= CodeBlock.TAB.length;
                    }
                }
                offset += line.length + 1;
            });
            this.quill.update(Quill.sources.USER);
            this.quill.setSelection(index, length, Quill.sources.SILENT);
        }
    };
}
function makeFormatHandler(format) {
    return {
        key: format[0].toUpperCase(),
        shortKey: true,
        handler: function (range, context) {
            this.quill.format(format, !context.format[format], Quill.sources.USER);
        }
    };
}
function normalize(binding) {
    if (typeof binding === 'string' || typeof binding === 'number') {
        return normalize({ key: binding });
    }
    if (typeof binding === 'object') {
        binding = clone(binding, false);
    }
    if (typeof binding.key === 'string') {
        if (Keyboard.keys[binding.key.toUpperCase()] != null) {
            binding.key = Keyboard.keys[binding.key.toUpperCase()];
        }
        else if (binding.key.length === 1) {
            binding.key = binding.key.toUpperCase().charCodeAt(0);
        }
        else {
            return null;
        }
    }
    return binding;
}
// export default Keyboard; 
///<reference path='../parchment/registry.ts' />
//import Parchment from 'parchment';
///<reference path='./core/quill.ts' />
//import Quill from './core/quill';
///<reference path='./blots/block.ts' />
//import Block, { BlockEmbed } from './blots/block';
///<reference path='./blots/break.ts' />
//import Break from './blots/break';
///<reference path='./blots/container.ts' />
//import Container from './blots/container';
///<reference path='./blots/Cursor.ts' />
//import Cursor from './blots/cursor';
///<reference path='./blots/embed.ts' />
//import Embed from './blots/embed';
///<reference path='./blots/inline.ts' />
//import Inline from './blots/inline';
///<reference path='./blots/scroll.ts' />
//import Scroll from './blots/scroll';
///<reference path='./blots/text.ts' />
//import TextBlot from './blots/text';
///<reference path='./modules/clipboard.ts' />
//import Clipboard from './modules/clipboard';
///<reference path='./modules/history.ts' />
//import History from './modules/history';
///<reference path='./modules/keyboard.ts' />
//import Keyboard from './modules/keyboard';
Quill.register({
    'blots/block': Block,
    'blots/block/embed': BlockEmbed,
    'blots/break': Break,
    'blots/container': Container,
    'blots/cursor': Cursor,
    'blots/embed': Embed,
    'blots/inline': Inline,
    'blots/scroll': Scroll,
    'blots/text': TextBlot,
    'modules/clipboard': Clipboard,
    'modules/history': History,
    'modules/keyboard': Keyboard
});
Parchment.register(Block, Break, Cursor, Inline, Scroll, TextBlot);
// module.exports = Quill; 
///<reference path='../blots/block.ts' />
// import Block from '../blots/block';
var Blockquote = (function (_super) {
    __extends(Blockquote, _super);
    function Blockquote() {
        return _super.apply(this, arguments) || this;
    }
    return Blockquote;
}(Block));
Blockquote.blotName = 'blockquote';
Blockquote.tagName = 'blockquote';
// export default Blockquote; 
///<reference path='../blots/inline.ts' />
// import Inline from '../blots/inline';
var Bold = (function (_super) {
    __extends(Bold, _super);
    function Bold() {
        return _super.apply(this, arguments) || this;
    }
    Bold.create = function () {
        return _super.create.call(this);
    };
    Bold.formats = function () {
        return true;
    };
    Bold.prototype.optimize = function () {
        _super.prototype.optimize.call(this);
        if (this.domNode.tagName !== this.statics.tagName[0]) {
            this.replaceWith(this.statics.blotName);
        }
    };
    return Bold;
}(Inline));
Bold.blotName = 'bold';
Bold.tagName = ['STRONG', 'B'];
// export default Bold; 
///<reference path='../blots/block.ts' />
// import Block from '../blots/block';
var Header = (function (_super) {
    __extends(Header, _super);
    function Header() {
        return _super.apply(this, arguments) || this;
    }
    Header.formats = function (domNode) {
        return this.tagName.indexOf(domNode.tagName) + 1;
    };
    return Header;
}(Block));
Header.blotName = 'header';
Header.tagName = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
// export default Header; 
///<reference path='../blots/inline.ts' />
// import Inline from '../blots/inline';
var Link = (function (_super) {
    __extends(Link, _super);
    function Link() {
        return _super.apply(this, arguments) || this;
    }
    Link.create = function (value) {
        var node = _super.create.call(this, value);
        value = this.sanitize(value);
        node.setAttribute('href', value);
        node.setAttribute('target', '_blank');
        return node;
    };
    Link.formats = function (domNode) {
        return domNode.getAttribute('href');
    };
    Link.sanitize = function (url) {
        return sanitize(url, ['http', 'https', 'mailto']) ? url : this.SANITIZED_URL;
    };
    Link.prototype.format = function (name, value) {
        if (name !== this.statics.blotName || !value)
            return _super.prototype.format.call(this, name, value);
        value = this.constructor.sanitize(value);
        this.domNode.setAttribute('href', value);
    };
    return Link;
}(Inline));
Link.blotName = 'link';
Link.tagName = 'A';
Link.SANITIZED_URL = 'about:blank';
function sanitize(url, protocols) {
    var anchor = document.createElement('a');
    anchor.href = url;
    var protocol = anchor.href.slice(0, anchor.href.indexOf(':'));
    return protocols.indexOf(protocol) > -1;
}
// export { Link as default, sanitize }; 
///<reference path='../blots/embed.ts' />
//import Embed from '../blots/embed';
///<reference path='../formats/link.ts' />
//import { sanitize } from '../formats/link';
var ATTRIBUTES = [
    'alt',
    'height',
    'width'
];
var Image = (function (_super) {
    __extends(Image, _super);
    function Image() {
        return _super.apply(this, arguments) || this;
    }
    Image.create = function (value) {
        var node = _super.create.call(this, value);
        if (typeof value === 'string') {
            node.setAttribute('src', this.sanitize(value));
        }
        return node;
    };
    Image.formats = function (domNode) {
        return ATTRIBUTES.reduce(function (formats, attribute) {
            if (domNode.hasAttribute(attribute)) {
                formats[attribute] = domNode.getAttribute(attribute);
            }
            return formats;
        }, {});
    };
    Image.match = function (url) {
        return /\.(jpe?g|gif|png)$/.test(url) || /^data:image\/.+;base64/.test(url);
    };
    Image.sanitize = function (url) {
        return sanitize(url, ['http', 'https', 'data']) ? url : '//:0';
    };
    Image.value = function (domNode) {
        return domNode.getAttribute('src');
    };
    Image.prototype.format = function (name, value) {
        if (ATTRIBUTES.indexOf(name) > -1) {
            if (value) {
                this.domNode.setAttribute(name, value);
            }
            else {
                this.domNode.removeAttribute(name);
            }
        }
        else {
            _super.prototype.format.call(this, name, value);
        }
    };
    return Image;
}(Embed));
Image.blotName = 'image';
Image.tagName = 'IMG';
// export default Image; 
// import Parchment from 'parchment';
var IdentAttributor = (function (_super) {
    __extends(IdentAttributor, _super);
    function IdentAttributor() {
        return _super.apply(this, arguments) || this;
    }
    IdentAttributor.prototype.add = function (node, value) {
        if (value === '+1' || value === '-1') {
            var indent_1 = this.value(node) || 0;
            value = (value === '+1' ? (indent_1 + 1) : (indent_1 - 1));
        }
        if (value === 0) {
            this.remove(node);
            return true;
        }
        else {
            return _super.prototype.add.call(this, node, value);
        }
    };
    IdentAttributor.prototype.canAdd = function (node, value) {
        return _super.prototype.canAdd.call(this, node, value) || _super.prototype.canAdd.call(this, node, parseInt(value));
    };
    IdentAttributor.prototype.value = function (node) {
        return parseInt(_super.prototype.value.call(this, node)) || undefined; // Don't return NaN
    };
    return IdentAttributor;
}(Parchment.ClassAttributor));
var IndentClass = new IdentAttributor('indent', 'ql-indent', {
    scope: Parchment.Scope.BLOCK,
    whitelist: [1, 2, 3, 4, 5, 6, 7, 8]
});
// export { IndentClass }; 
///<reference path='./bold.ts' />
// import Bold from './bold';
var Italic = (function (_super) {
    __extends(Italic, _super);
    function Italic() {
        return _super.apply(this, arguments) || this;
    }
    return Italic;
}(Bold));
Italic.blotName = 'italic';
Italic.tagName = ['EM', 'I'];
// export default Italic; 
// import Parchment from 'parchment';
///<reference path='../blots/block.ts' />
// import Block from '../blots/block';
///<reference path='../blots/container.ts' />
//import Container from '../blots/container';
var ListItem = (function (_super) {
    __extends(ListItem, _super);
    function ListItem() {
        return _super.apply(this, arguments) || this;
    }
    ListItem.formats = function (domNode) {
        return domNode.tagName === this.tagName ? undefined : _super.formats.call(this, domNode);
    };
    ListItem.prototype.format = function (name, value) {
        if (name === List.blotName && !value) {
            this.replaceWith(Parchment.create(this.statics.scope));
        }
        else {
            _super.prototype.format.call(this, name, value);
        }
    };
    ListItem.prototype.remove = function () {
        if (this.prev == null && this.next == null) {
            this.parent.remove();
        }
        else {
            _super.prototype.remove.call(this);
        }
    };
    ListItem.prototype.replaceWith = function (name, value) {
        this.parent.isolate(this.offset(this.parent), this.length());
        if (name === this.parent.statics.blotName) {
            this.parent.replaceWith(name, value);
            return this;
        }
        else {
            this.parent.unwrap();
            return _super.prototype.replaceWith.call(this, name, value);
        }
    };
    return ListItem;
}(Block));
ListItem.blotName = 'list-item';
ListItem.tagName = 'LI';
var List = (function (_super) {
    __extends(List, _super);
    function List() {
        return _super.apply(this, arguments) || this;
    }
    List.create = function (value) {
        var tagName = value === 'ordered' ? 'OL' : 'UL';
        var node = _super.create.call(this, tagName);
        if (value === 'checked' || value === 'unchecked') {
            node.setAttribute('data-checked', value === 'checked');
        }
        return node;
    };
    List.formats = function (domNode) {
        if (domNode.tagName === 'OL')
            return 'ordered';
        if (domNode.tagName === 'UL') {
            if (domNode.hasAttribute('data-checked')) {
                return domNode.getAttribute('data-checked') === 'true' ? 'checked' : 'unchecked';
            }
            else {
                return 'bullet';
            }
        }
        return undefined;
    };
    List.prototype.format = function (name, value) {
        if (this.children.length > 0) {
            this.children.tail.format(name, value);
        }
    };
    List.prototype.formats = function () {
        // We don't inherit from FormatBlot
        return _a = {}, _a[this.statics.blotName] = this.statics.formats(this.domNode), _a;
        var _a;
    };
    List.prototype.insertBefore = function (blot, ref) {
        if (blot instanceof ListItem) {
            _super.prototype.insertBefore.call(this, blot, ref);
        }
        else {
            var index = ref == null ? this.length() : ref.offset(this);
            var after = this.split(index);
            after.parent.insertBefore(blot, after);
        }
    };
    List.prototype.optimize = function () {
        _super.prototype.optimize.call(this);
        var next = this.next;
        if (next != null && next.prev === this &&
            next.statics.blotName === this.statics.blotName &&
            next.domNode.tagName === this.domNode.tagName &&
            next.domNode.getAttribute('data-checked') === this.domNode.getAttribute('data-checked')) {
            next.moveChildren(this);
            next.remove();
        }
    };
    List.prototype.replace = function (target) {
        if (target.statics.blotName !== this.statics.blotName) {
            var item = Parchment.create(this.statics.defaultChild);
            target.moveChildren(item);
            this.appendChild(item);
        }
        _super.prototype.replace.call(this, target);
    };
    return List;
}(Container));
List.blotName = 'list';
List.scope = Parchment.Scope.BLOCK_BLOT;
List.tagName = ['OL', 'UL'];
List.defaultChild = 'list-item';
List.allowedChildren = [ListItem];
// export { ListItem, List as default }; 
///<reference path='../blots/inline.ts' />
// import Inline from '../blots/inline';
var Script = (function (_super) {
    __extends(Script, _super);
    function Script() {
        return _super.apply(this, arguments) || this;
    }
    Script.create = function (value) {
        if (value === 'super') {
            return document.createElement('sup');
        }
        else if (value === 'sub') {
            return document.createElement('sub');
        }
        else {
            return _super.create.call(this, value);
        }
    };
    Script.formats = function (domNode) {
        if (domNode.tagName === 'SUB')
            return 'sub';
        if (domNode.tagName === 'SUP')
            return 'super';
        return undefined;
    };
    return Script;
}(Inline));
Script.blotName = 'script';
Script.tagName = ['SUB', 'SUP'];
// export default Script; 
///<reference path='../blots/inline.ts' />
// import Inline from '../blots/inline';
var Strike = (function (_super) {
    __extends(Strike, _super);
    function Strike() {
        return _super.apply(this, arguments) || this;
    }
    return Strike;
}(Inline));
Strike.blotName = 'strike';
Strike.tagName = 'S';
// export default Strike; 
///<reference path='../blots/inline.ts' />
//import Inline from '../blots/inline';
var Underline = (function (_super) {
    __extends(Underline, _super);
    function Underline() {
        return _super.apply(this, arguments) || this;
    }
    return Underline;
}(Inline));
Underline.blotName = 'underline';
Underline.tagName = 'U';
//Underline.blotName = 'underline';
//Underline.tagName = 'U';
// export default Underline; 
///<reference path='../blots/block.ts' />
// import { BlockEmbed } from '../blots/block';
///<reference path='../formats/link.ts' />
// import Link from '../formats/link';
var ATTRIBUTES = [
    'height',
    'width'
];
var Video = (function (_super) {
    __extends(Video, _super);
    function Video() {
        return _super.apply(this, arguments) || this;
    }
    Video.create = function (value) {
        var node = _super.create.call(this, value);
        node.setAttribute('frameborder', '0');
        node.setAttribute('allowfullscreen', true);
        node.setAttribute('src', this.sanitize(value));
        return node;
    };
    Video.formats = function (domNode) {
        return ATTRIBUTES.reduce(function (formats, attribute) {
            if (domNode.hasAttribute(attribute)) {
                formats[attribute] = domNode.getAttribute(attribute);
            }
            return formats;
        }, {});
    };
    Video.sanitize = function (url) {
        return Link.sanitize(url);
    };
    Video.value = function (domNode) {
        return domNode.getAttribute('src');
    };
    Video.prototype.format = function (name, value) {
        if (ATTRIBUTES.indexOf(name) > -1) {
            if (value) {
                this.domNode.setAttribute(name, value);
            }
            else {
                this.domNode.removeAttribute(name);
            }
        }
        else {
            _super.prototype.format.call(this, name, value);
        }
    };
    return Video;
}(BlockEmbed));
Video.blotName = 'video';
Video.className = 'ql-video';
Video.tagName = 'IFRAME';
// export default Video; 
///<reference path='../blots/embed.ts' />
// import Embed from '../blots/embed';
///<reference path='../core/quill.ts' />
// import Quill from '../core/quill';
var FormulaBlot = (function (_super) {
    __extends(FormulaBlot, _super);
    function FormulaBlot() {
        return _super.apply(this, arguments) || this;
    }
    FormulaBlot.create = function (value) {
        var node = _super.create.call(this, value);
        if (typeof value === 'string') {
            window.katex.render(value, node);
            node.setAttribute('data-value', value);
        }
        node.setAttribute('contenteditable', false);
        return node;
    };
    FormulaBlot.value = function (domNode) {
        return domNode.getAttribute('data-value');
    };
    FormulaBlot.prototype.index = function () {
        return 1;
    };
    return FormulaBlot;
}(Embed));
FormulaBlot.blotName = 'formula';
FormulaBlot.className = 'ql-formula';
FormulaBlot.tagName = 'SPAN';
function Formula() {
    if (window.katex == null) {
        throw new Error('Formula module requires KaTeX.');
    }
    Quill.register(FormulaBlot, true);
}
// export { FormulaBlot, Formula as default }; 
// import Parchment from 'parchment';
///<reference path='../core/quill.ts' />
// import Quill from '../core/quill';
///<reference path='../core/module.ts' />
// import Module from '../core/module';
///<reference path='../formats/code.ts' />
// import CodeBlock from '../formats/code';
var SyntaxCodeBlock = (function (_super) {
    __extends(SyntaxCodeBlock, _super);
    function SyntaxCodeBlock() {
        return _super.apply(this, arguments) || this;
    }
    SyntaxCodeBlock.prototype.replaceWith = function (block) {
        this.domNode.textContent = this.domNode.textContent;
        this.attach();
        _super.prototype.replaceWith.call(this, block);
    };
    SyntaxCodeBlock.prototype.highlight = function (highlight) {
        if (this.cachedHTML !== this.domNode.innerHTML) {
            var text = this.domNode.textContent;
            if (text.trim().length > 0 || this.cachedHTML == null) {
                this.domNode.innerHTML = highlight(text);
                this.attach();
            }
            this.cachedHTML = this.domNode.innerHTML;
        }
    };
    return SyntaxCodeBlock;
}(CodeBlock));
SyntaxCodeBlock.className = 'ql-syntax';
var CodeToken = new Parchment.ClassAttributor('token', 'hljs', {
    scope: Parchment.Scope.INLINE
});
var Syntax = (function (_super) {
    __extends(Syntax, _super);
    function Syntax(quill, options) {
        var _this = _super.call(this, quill, options) || this;
        if (typeof _this.options.highlight !== 'function') {
            throw new Error('Syntax module requires highlight.js. Please include the library on the page before Quill.');
        }
        Quill.register(CodeToken, true);
        Quill.register(SyntaxCodeBlock, true);
        var timer = null;
        _this.quill.on(Quill.events.SCROLL_OPTIMIZE, function () {
            if (timer != null)
                return;
            timer = setTimeout(function () {
                _this.highlight();
                timer = null;
            }, 100);
        });
        _this.highlight();
        return _this;
    }
    Syntax.prototype.highlight = function () {
        var _this = this;
        if (this.quill.selection.composing)
            return;
        var range = this.quill.getSelection();
        this.quill.scroll.descendants(SyntaxCodeBlock).forEach(function (code) {
            code.highlight(_this.options.highlight);
        });
        this.quill.update(Quill.sources.SILENT);
        if (range != null) {
            this.quill.setSelection(range, Quill.sources.SILENT);
        }
    };
    return Syntax;
}(Module));
Syntax.DEFAULTS = {
    highlight: (function () {
        if (window.hljs == null)
            return null;
        return function (text) {
            var result = window.hljs.highlightAuto(text);
            return result.value;
        };
    })()
};
// export { SyntaxCodeBlock as CodeBlock, CodeToken, Syntax as default }; 
//import Delta from 'quill-delta';
//import Parchment from 'parchment';
///<reference path='../core/quill.ts' />
//import Quill from '../core/quill';
///<reference path='../core/logger.ts' />
//import logger from '../core/logger';
///<reference path='../core/module.ts' />
//import Module from '../core/module';
//let debug = logger('quill:toolbar');
var Toolbar = (function (_super) {
    __extends(Toolbar, _super);
    function Toolbar(quill, options) {
        var _this = _super.call(this, quill, options) || this;
        if (Array.isArray(_this.options.container)) {
            var container = document.createElement('div');
            addControls(container, _this.options.container);
            quill.container.parentNode.insertBefore(container, quill.container);
            _this.container = container;
        }
        else if (typeof _this.options.container === 'string') {
            _this.container = document.querySelector(_this.options.container);
        }
        else {
            _this.container = _this.options.container;
        }
        if (!(_this.container instanceof HTMLElement)) {
            return debug.error('Container required for toolbar', _this.options);
        }
        _this.container.classList.add('ql-toolbar');
        _this.controls = [];
        _this.handlers = {};
        Object.keys(_this.options.handlers).forEach(function (format) {
            _this.addHandler(format, _this.options.handlers[format]);
        });
        [].forEach.call(_this.container.querySelectorAll('button, select'), function (input) {
            _this.attach(input);
        });
        _this.quill.on(Quill.events.EDITOR_CHANGE, function (type, range) {
            if (type === Quill.events.SELECTION_CHANGE) {
                _this.update(range);
            }
        });
        _this.quill.on(Quill.events.SCROLL_OPTIMIZE, function () {
            var range = _this.quill.selection.getRange()[0]; // quill.getSelection triggers update
            _this.update(range);
        });
        return _this;
    }
    Toolbar.prototype.addHandler = function (format, handler) {
        this.handlers[format] = handler;
    };
    Toolbar.prototype.attach = function (input) {
        var _this = this;
        var format = [].find.call(input.classList, function (className) {
            return className.indexOf('ql-') === 0;
        });
        if (!format)
            return;
        format = format.slice('ql-'.length);
        if (input.tagName === 'BUTTON') {
            input.setAttribute('type', 'button');
        }
        if (this.handlers[format] == null) {
            if (this.quill.scroll.whitelist != null && this.quill.scroll.whitelist[format] == null) {
                debug.warn('ignoring attaching to disabled format', format, input);
                return;
            }
            if (Parchment.query(format) == null) {
                debug.warn('ignoring attaching to nonexistent format', format, input);
                return;
            }
        }
        var eventName = input.tagName === 'SELECT' ? 'change' : 'click';
        input.addEventListener(eventName, function (e) {
            var value;
            if (input.tagName === 'SELECT') {
                if (input.selectedIndex < 0)
                    return;
                var selected = input.options[input.selectedIndex];
                if (selected.hasAttribute('selected')) {
                    value = false;
                }
                else {
                    value = selected.value || false;
                }
            }
            else {
                if (input.classList.contains('ql-active')) {
                    value = false;
                }
                else {
                    value = input.value || !input.hasAttribute('value');
                }
                e.preventDefault();
            }
            _this.quill.focus();
            var range = _this.quill.selection.getRange()[0];
            if (_this.handlers[format] != null) {
                _this.handlers[format].call(_this, value);
            }
            else if (Parchment.query(format).prototype instanceof Parchment.EmbedBlot) {
                value = prompt("Enter " + format);
                if (!value)
                    return;
                _this.quill.updateContents(new Delta()
                    .retain(range.index)
                    .delete(range.length)
                    .insert((_a = {}, _a[format] = value, _a)), Quill.sources.USER);
            }
            else {
                _this.quill.format(format, value, Quill.sources.USER);
            }
            _this.update(range);
            var _a;
        });
        // TODO use weakmap
        this.controls.push([format, input]);
    };
    Toolbar.prototype.update = function (range) {
        var formats = range == null ? {} : this.quill.getFormat(range);
        this.controls.forEach(function (pair) {
            var format = pair[0], input = pair[1];
            if (input.tagName === 'SELECT') {
                var option = void 0;
                if (range == null) {
                    option = null;
                }
                else if (formats[format] == null) {
                    option = input.querySelector('option[selected]');
                }
                else if (!Array.isArray(formats[format])) {
                    var value = formats[format];
                    if (typeof value === 'string') {
                        value = value.replace(/\"/g, '\\"');
                    }
                    option = input.querySelector("option[value=\"" + value + "\"]");
                }
                if (option == null) {
                    input.value = ''; // TODO make configurable?
                    input.selectedIndex = -1;
                }
                else {
                    option.selected = true;
                }
            }
            else {
                if (range == null) {
                    input.classList.remove('ql-active');
                }
                else if (input.hasAttribute('value')) {
                    // both being null should match (default values)
                    // '1' should match with 1 (headers)
                    var isActive = formats[format] === input.getAttribute('value') ||
                        (formats[format] != null && formats[format].toString() === input.getAttribute('value')) ||
                        (formats[format] == null && !input.getAttribute('value'));
                    input.classList.toggle('ql-active', isActive);
                }
                else {
                    input.classList.toggle('ql-active', formats[format] != null);
                }
            }
        });
    };
    return Toolbar;
}(Module));
Toolbar.DEFAULTS = {};
function addButton(container, format, value) {
    var input = document.createElement('button');
    input.setAttribute('type', 'button');
    input.classList.add('ql-' + format);
    if (value != null) {
        input.value = value;
    }
    container.appendChild(input);
}
function addControls(container, groups) {
    if (!Array.isArray(groups[0])) {
        groups = [groups];
    }
    groups.forEach(function (controls) {
        var group = document.createElement('span');
        group.classList.add('ql-formats');
        controls.forEach(function (control) {
            if (typeof control === 'string') {
                addButton(group, control);
            }
            else {
                var format = Object.keys(control)[0];
                var value = control[format];
                if (Array.isArray(value)) {
                    addSelect(group, format, value);
                }
                else {
                    addButton(group, format, value);
                }
            }
        });
        container.appendChild(group);
    });
}
function addSelect(container, format, values) {
    var input = document.createElement('select');
    input.classList.add('ql-' + format);
    values.forEach(function (value) {
        var option = document.createElement('option');
        if (value !== false) {
            option.setAttribute('value', value);
        }
        else {
            option.setAttribute('selected', 'selected');
        }
        input.appendChild(option);
    });
    container.appendChild(input);
}
Toolbar.DEFAULTS = {
    container: null,
    handlers: {
        clean: function () {
            var _this = this;
            var range = this.quill.getSelection();
            if (range == null)
                return;
            if (range.length == 0) {
                var formats = this.quill.getFormat();
                Object.keys(formats).forEach(function (name) {
                    // Clean functionality in existing apps only clean inline formats
                    if (Parchment.query(name, Parchment.Scope.INLINE) != null) {
                        _this.quill.format(name, false);
                    }
                });
            }
            else {
                this.quill.removeFormat(range, Quill.sources.USER);
            }
        },
        direction: function (value) {
            var align = this.quill.getFormat()['align'];
            if (value === 'rtl' && align == null) {
                this.quill.format('align', 'right', Quill.sources.USER);
            }
            else if (!value && align === 'right') {
                this.quill.format('align', false, Quill.sources.USER);
            }
            this.quill.format('direction', value, Quill.sources.USER);
        },
        link: function (value) {
            if (value === true) {
                value = prompt('Enter link URL:');
            }
            this.quill.format('link', value, Quill.sources.USER);
        },
        indent: function (value) {
            var range = this.quill.getSelection();
            var formats = this.quill.getFormat(range);
            var indent = parseInt(formats.indent || 0);
            if (value === '+1' || value === '-1') {
                var modifier = (value === '+1') ? 1 : -1;
                if (formats.direction === 'rtl')
                    modifier *= -1;
                this.quill.format('indent', indent + modifier, Quill.sources.USER);
            }
        }
    }
};
// export { Toolbar as default, addControls }; 
// import DropdownIcon from '../assets/icons/dropdown.svg';
var Picker = (function () {
    function Picker(select) {
        var _this = this;
        this.select = select;
        this.container = document.createElement('span');
        this.buildPicker();
        this.select.style.display = 'none';
        this.select.parentNode.insertBefore(this.container, this.select);
        this.label.addEventListener('click', function () {
            _this.container.classList.toggle('ql-expanded');
        });
        this.select.addEventListener('change', this.update.bind(this));
    }
    Picker.prototype.buildItem = function (option) {
        var _this = this;
        var item = document.createElement('span');
        item.classList.add('ql-picker-item');
        if (option.hasAttribute('value')) {
            item.setAttribute('data-value', option.getAttribute('value'));
        }
        if (option.textContent) {
            item.setAttribute('data-label', option.textContent);
        }
        item.addEventListener('click', function () {
            _this.selectItem(item, true);
        });
        return item;
    };
    Picker.prototype.buildLabel = function () {
        var label = document.createElement('span');
        label.classList.add('ql-picker-label');
        label.innerHTML = dropdown; //DropdownIcon;
        this.container.appendChild(label);
        return label;
    };
    Picker.prototype.buildOptions = function () {
        var _this = this;
        var options = document.createElement('span');
        options.classList.add('ql-picker-options');
        [].slice.call(this.select.options).forEach(function (option) {
            var item = _this.buildItem(option);
            options.appendChild(item);
            if (option.hasAttribute('selected')) {
                _this.selectItem(item);
            }
        });
        this.container.appendChild(options);
    };
    Picker.prototype.buildPicker = function () {
        var _this = this;
        [].slice.call(this.select.attributes).forEach(function (item) {
            _this.container.setAttribute(item.name, item.value);
        });
        this.container.classList.add('ql-picker');
        this.label = this.buildLabel();
        this.buildOptions();
    };
    Picker.prototype.close = function () {
        this.container.classList.remove('ql-expanded');
    };
    Picker.prototype.selectItem = function (item, trigger) {
        if (trigger === void 0) { trigger = false; }
        var selected = this.container.querySelector('.ql-selected');
        if (item === selected)
            return;
        if (selected != null) {
            selected.classList.remove('ql-selected');
        }
        if (item == null)
            return;
        item.classList.add('ql-selected');
        this.select.selectedIndex = [].indexOf.call(item.parentNode.children, item);
        if (item.hasAttribute('data-value')) {
            this.label.setAttribute('data-value', item.getAttribute('data-value'));
        }
        else {
            this.label.removeAttribute('data-value');
        }
        if (item.hasAttribute('data-label')) {
            this.label.setAttribute('data-label', item.getAttribute('data-label'));
        }
        else {
            this.label.removeAttribute('data-label');
        }
        if (trigger) {
            if (typeof Event === 'function') {
                this.select.dispatchEvent(new Event('change'));
            }
            else if (typeof Event === 'object') {
                var event_1 = document.createEvent('Event');
                event_1.initEvent('change', true, true);
                this.select.dispatchEvent(event_1);
            }
            this.close();
        }
    };
    Picker.prototype.update = function () {
        var option;
        if (this.select.selectedIndex > -1) {
            var item = this.container.querySelector('.ql-picker-options').children[this.select.selectedIndex];
            option = this.select.options[this.select.selectedIndex];
            this.selectItem(item);
        }
        else {
            this.selectItem(null);
        }
        var isActive = option != null && option !== this.select.querySelector('option[selected]');
        this.label.classList.toggle('ql-active', isActive);
    };
    return Picker;
}());
// export default Picker; 
///<reference path='./picker.ts' />
// import Picker from './picker';
var ColorPicker = (function (_super) {
    __extends(ColorPicker, _super);
    function ColorPicker(select, label) {
        var _this = _super.call(this, select) || this;
        _this.label.innerHTML = label;
        _this.container.classList.add('ql-color-picker');
        [].slice.call(_this.container.querySelectorAll('.ql-picker-item'), 0, 7).forEach(function (item) {
            item.classList.add('ql-primary');
        });
        return _this;
    }
    ColorPicker.prototype.buildItem = function (option) {
        var item = _super.prototype.buildItem.call(this, option);
        item.style.backgroundColor = option.getAttribute('value') || '';
        return item;
    };
    ColorPicker.prototype.selectItem = function (item, trigger) {
        _super.prototype.selectItem.call(this, item, trigger);
        var colorLabel = this.label.querySelector('.ql-color-label');
        var value = item ? item.getAttribute('data-value') || '' : '';
        if (colorLabel) {
            if (colorLabel.tagName === 'line') {
                colorLabel.style.stroke = value;
            }
            else {
                colorLabel.style.fill = value;
            }
        }
    };
    return ColorPicker;
}(Picker));
// export default ColorPicker; 
///<reference path='./picker.ts' />
// import Picker from './picker';
var IconPicker = (function (_super) {
    __extends(IconPicker, _super);
    function IconPicker(select, icons) {
        var _this = _super.call(this, select) || this;
        _this.container.classList.add('ql-icon-picker');
        [].forEach.call(_this.container.querySelectorAll('.ql-picker-item'), function (item) {
            item.innerHTML = icons[item.getAttribute('data-value') || ''];
        });
        _this.defaultItem = _this.container.querySelector('.ql-selected');
        _this.selectItem(_this.defaultItem);
        return _this;
    }
    IconPicker.prototype.selectItem = function (item, trigger) {
        _super.prototype.selectItem.call(this, item, trigger);
        item = item || this.defaultItem;
        this.label.innerHTML = item.innerHTML;
    };
    return IconPicker;
}(Picker));
// export default IconPicker; 
var Tooltip = (function () {
    function Tooltip(quill, boundsContainer) {
        var _this = this;
        this.quill = quill;
        this.boundsContainer = boundsContainer || document.body;
        this.root = quill.addContainer('ql-tooltip');
        this.root.innerHTML = this.constructor.TEMPLATE;
        var offset = parseInt(window.getComputedStyle(this.root).marginTop);
        this.quill.root.addEventListener('scroll', function () {
            _this.root.style.marginTop = (-1 * _this.quill.root.scrollTop) + offset + 'px';
            _this.checkBounds();
        });
        this.hide();
    }
    Tooltip.prototype.checkBounds = function () {
        this.root.classList.toggle('ql-out-top', this.root.offsetTop <= 0);
        this.root.classList.remove('ql-out-bottom');
        this.root.classList.toggle('ql-out-bottom', this.root.offsetTop + this.root.offsetHeight >= this.quill.root.offsetHeight);
    };
    Tooltip.prototype.hide = function () {
        this.root.classList.add('ql-hidden');
    };
    Tooltip.prototype.position = function (reference) {
        var left = reference.left + reference.width / 2 - this.root.offsetWidth / 2;
        var top = reference.bottom + this.quill.root.scrollTop;
        this.root.style.left = left + 'px';
        this.root.style.top = top + 'px';
        var containerBounds = this.boundsContainer.getBoundingClientRect();
        var rootBounds = this.root.getBoundingClientRect();
        var shift = 0;
        if (rootBounds.right > containerBounds.right) {
            shift = containerBounds.right - rootBounds.right;
            this.root.style.left = (left + shift) + 'px';
        }
        if (rootBounds.left < containerBounds.left) {
            shift = containerBounds.left - rootBounds.left;
            this.root.style.left = (left + shift) + 'px';
        }
        this.checkBounds();
        return shift;
    };
    Tooltip.prototype.show = function () {
        this.root.classList.remove('ql-editing');
        this.root.classList.remove('ql-hidden');
    };
    return Tooltip;
}());
// export default Tooltip; 
//import extend from 'extend';
//import Delta from 'quill-delta';
///<reference path='../core/emitter.ts' />
//import Emitter from '../core/emitter';
///<reference path='../modules/keyboard.ts' />
//import Keyboard from '../modules/keyboard';
///<reference path='../core/theme.ts' />
//import Theme from '../core/theme';
///<reference path='../ui/color-picker.ts' />
//import ColorPicker from '../ui/color-picker';
///<reference path='../ui/icon-picker.ts' />
//import IconPicker from '../ui/icon-picker';
///<reference path='../ui/picker.ts' />
//import Picker from '../ui/picker';
///<reference path='../ui/tooltip.ts' />
//import Tooltip from '../ui/tooltip';
var ALIGNS = [false, 'center', 'right', 'justify'];
var COLORS = [
    "#000000", "#e60000", "#ff9900", "#ffff00", "#008a00", "#0066cc", "#9933ff",
    "#ffffff", "#facccc", "#ffebcc", "#ffffcc", "#cce8cc", "#cce0f5", "#ebd6ff",
    "#bbbbbb", "#f06666", "#ffc266", "#ffff66", "#66b966", "#66a3e0", "#c285ff",
    "#888888", "#a10000", "#b26b00", "#b2b200", "#006100", "#0047b2", "#6b24b2",
    "#444444", "#5c0000", "#663d00", "#666600", "#003700", "#002966", "#3d1466"
];
var FONTS = [false, 'serif', 'monospace'];
var HEADERS = ['1', '2', '3', false];
var SIZES = ['small', false, 'large', 'huge'];
var BaseTheme = (function (_super) {
    __extends(BaseTheme, _super);
    function BaseTheme(quill, options) {
        var _this = _super.call(this, quill, options) || this;
        var listener = function (e) {
            if (!document.body.contains(quill.root)) {
                return document.body.removeEventListener('click', listener);
            }
            if (_this.tooltip != null && !_this.tooltip.root.contains(e.target) &&
                document.activeElement !== _this.tooltip.textbox && !_this.quill.hasFocus()) {
                _this.tooltip.hide();
            }
            if (_this.pickers != null) {
                _this.pickers.forEach(function (picker) {
                    if (!picker.container.contains(e.target)) {
                        picker.close();
                    }
                });
            }
        };
        document.body.addEventListener('click', listener);
        return _this;
    }
    BaseTheme.prototype.addModule = function (name) {
        var module = _super.prototype.addModule.call(this, name);
        if (name === 'toolbar') {
            this.extendToolbar(module);
        }
        return module;
    };
    BaseTheme.prototype.buildButtons = function (buttons, icons) {
        buttons.forEach(function (button) {
            var className = button.getAttribute('class') || '';
            className.split(/\s+/).forEach(function (name) {
                if (!name.startsWith('ql-'))
                    return;
                name = name.slice('ql-'.length);
                if (icons[name] == null)
                    return;
                if (name === 'direction') {
                    button.innerHTML = icons[name][''] + icons[name]['rtl'];
                }
                else if (typeof icons[name] === 'string') {
                    button.innerHTML = icons[name];
                }
                else {
                    var value = button.value || '';
                    if (value != null && icons[name][value]) {
                        button.innerHTML = icons[name][value];
                    }
                }
            });
        });
    };
    BaseTheme.prototype.buildPickers = function (selects, icons) {
        var _this = this;
        this.pickers = selects.map(function (select) {
            if (select.classList.contains('ql-align')) {
                if (select.querySelector('option') == null) {
                    fillSelect(select, ALIGNS);
                }
                return new IconPicker(select, icons.align);
            }
            else if (select.classList.contains('ql-background') || select.classList.contains('ql-color')) {
                var format = select.classList.contains('ql-background') ? 'background' : 'color';
                if (select.querySelector('option') == null) {
                    fillSelect(select, COLORS, format === 'background' ? '#ffffff' : '#000000');
                }
                return new ColorPicker(select, icons[format]);
            }
            else {
                if (select.querySelector('option') == null) {
                    if (select.classList.contains('ql-font')) {
                        fillSelect(select, FONTS);
                    }
                    else if (select.classList.contains('ql-header')) {
                        fillSelect(select, HEADERS);
                    }
                    else if (select.classList.contains('ql-size')) {
                        fillSelect(select, SIZES);
                    }
                }
                return new Picker(select);
            }
        });
        var update = function () {
            _this.pickers.forEach(function (picker) {
                picker.update();
            });
        };
        this.quill.on(Emitter.events.SELECTION_CHANGE, update)
            .on(Emitter.events.SCROLL_OPTIMIZE, update);
    };
    return BaseTheme;
}(Theme));
BaseTheme.DEFAULTS = extend(true, {}, Theme.DEFAULTS, {
    modules: {
        toolbar: {
            handlers: {
                formula: function () {
                    this.quill.theme.tooltip.edit('formula');
                },
                image: function () {
                    var _this = this;
                    var fileInput = this.container.querySelector('input.ql-image[type=file]');
                    if (fileInput == null) {
                        fileInput = document.createElement('input');
                        fileInput.setAttribute('type', 'file');
                        fileInput.setAttribute('accept', 'image/*');
                        fileInput.classList.add('ql-image');
                        fileInput.addEventListener('change', function () {
                            if (fileInput.files != null && fileInput.files[0] != null) {
                                var reader = new FileReader();
                                reader.onload = function (e) {
                                    var range = _this.quill.getSelection(true);
                                    _this.quill.updateContents(new Delta()
                                        .retain(range.index)
                                        .delete(range.length)
                                        .insert({ image: e.target.result }), Emitter.sources.USER);
                                    fileInput.value = "";
                                };
                                reader.readAsDataURL(fileInput.files[0]);
                            }
                        });
                        this.container.appendChild(fileInput);
                    }
                    fileInput.click();
                },
                video: function () {
                    this.quill.theme.tooltip.edit('video');
                }
            }
        }
    }
});
var BaseTooltip = (function (_super) {
    __extends(BaseTooltip, _super);
    function BaseTooltip(quill, boundsContainer) {
        var _this = _super.call(this, quill, boundsContainer) || this;
        _this.textbox = _this.root.querySelector('input[type="text"]');
        _this.listen();
        return _this;
    }
    BaseTooltip.prototype.listen = function () {
        var _this = this;
        this.textbox.addEventListener('keydown', function (event) {
            if (Keyboard.match(event, 'enter')) {
                _this.save();
                event.preventDefault();
            }
            else if (Keyboard.match(event, 'escape')) {
                _this.cancel();
                event.preventDefault();
            }
        });
    };
    BaseTooltip.prototype.cancel = function () {
        this.hide();
    };
    BaseTooltip.prototype.edit = function (mode, preview) {
        if (mode === void 0) { mode = 'link'; }
        if (preview === void 0) { preview = null; }
        this.root.classList.remove('ql-hidden');
        this.root.classList.add('ql-editing');
        if (preview != null) {
            this.textbox.value = preview;
        }
        else if (mode !== this.root.getAttribute('data-mode')) {
            this.textbox.value = '';
        }
        this.position(this.quill.getBounds(this.quill.selection.savedRange));
        this.textbox.select();
        this.textbox.setAttribute('placeholder', this.textbox.getAttribute("data-" + mode) || '');
        this.root.setAttribute('data-mode', mode);
    };
    BaseTooltip.prototype.restoreFocus = function () {
        var scrollTop = this.quill.root.scrollTop;
        this.quill.focus();
        this.quill.root.scrollTop = scrollTop;
    };
    BaseTooltip.prototype.save = function () {
        var value = this.textbox.value;
        switch (this.root.getAttribute('data-mode')) {
            case 'link': {
                var scrollTop = this.quill.root.scrollTop;
                if (this.linkRange) {
                    this.quill.formatText(this.linkRange, 'link', value, Emitter.sources.USER);
                    delete this.linkRange;
                }
                else {
                    this.restoreFocus();
                    this.quill.format('link', value, Emitter.sources.USER);
                }
                this.quill.root.scrollTop = scrollTop;
                break;
            }
            case 'video': {
                var match = value.match(/^(https?):\/\/(www\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/) ||
                    value.match(/^(https?):\/\/(www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/);
                if (match) {
                    value = match[1] + '://www.youtube.com/embed/' + match[3] + '?showinfo=0';
                }
                else if (match = value.match(/^(https?):\/\/(www\.)?vimeo\.com\/(\d+)/)) {
                    value = match[1] + '://player.vimeo.com/video/' + match[3] + '/';
                }
            } // eslint-disable-next-line no-fallthrough
            case 'formula': {
                var range = this.quill.getSelection(true);
                var index = range.index + range.length;
                if (range != null) {
                    this.quill.insertEmbed(index, this.root.getAttribute('data-mode'), value, Emitter.sources.USER);
                    if (this.root.getAttribute('data-mode') === 'formula') {
                        this.quill.insertText(index + 1, ' ', Emitter.sources.USER);
                    }
                    this.quill.setSelection(index + 2, Emitter.sources.USER);
                }
                break;
            }
            default:
        }
        this.textbox.value = '';
        this.hide();
    };
    return BaseTooltip;
}(Tooltip));
function fillSelect(select, values, defaultValue) {
    if (defaultValue === void 0) { defaultValue = false; }
    values.forEach(function (value) {
        var option = document.createElement('option');
        if (value === defaultValue) {
            option.setAttribute('selected', 'selected');
        }
        else {
            option.setAttribute('value', value);
        }
        select.appendChild(option);
    });
}
// export { BaseTooltip, BaseTheme as default }; 
var ICONS = {
    'align': {
        '': /*__webpack_require__(70)*/ alignLeft,
        'center': /*__webpack_require__(71)*/ alignCenter,
        'right': /*__webpack_require__(72)*/ alignRight,
        'justify': /*__webpack_require__(73)*/ alignJustify
    },
    'background': /*__webpack_require__(74)*/ background,
    'blockquote': /*__webpack_require__(75)*/ blockquote,
    'bold': /*__webpack_require__(76)*/ bold,
    'clean': /*__webpack_require__(77)*/ clean,
    'code': /*__webpack_require__(78)*/ code,
    'code-block': /* __webpack_require__(78)*/ code,
    'color': /*__webpack_require__(79)*/ color,
    'direction': {
        '': /*__webpack_require__(80)*/ direction_ltr,
        'rtl': /*__webpack_require__(81)*/ direction_rtl
    },
    'float': {
        'center': /*__webpack_require__(82)*/ float_center,
        'full': /*__webpack_require__(83)*/ float_full,
        'left': /*__webpack_require__(84)*/ float_left,
        'right': /*__webpack_require__(85)*/ float_right
    },
    'formula': /*__webpack_require__(86)*/ formula,
    'header': {
        '1': /*__webpack_require__(87)*/ header,
        '2': /*__webpack_require__(88)*/ header_2
    },
    'italic': /*__webpack_require__(89)*/ italic,
    'image': /*__webpack_require__(90)*/ image,
    'indent': {
        '+1': /*__webpack_require__(91)*/ indent,
        '-1': /*__webpack_require__(92)*/ outdent
    },
    'link': /*__webpack_require__(93)*/ link,
    'list': {
        'ordered': /*__webpack_require__(94)*/ list_ordered,
        'bullet': /*__webpack_require__(95)*/ list_bullet,
        'unchecked': /*__webpack_require__(96)*/ list_check
    },
    'script': {
        'sub': /*__webpack_require__(97)*/ subscript,
        'super': /* __webpack_require__(98)*/ superscript
    },
    'strike': /*__webpack_require__(99)*/ strike,
    'underline': /*__webpack_require__(100)*/ underline,
    'video': /*__webpack_require__(101)*/ video
};
//import extend from 'extend';
///<reference path='../core/emitter.ts' />
//import Emitter from '../core/emitter';
///<reference path='./base.ts' />
//import BaseTheme, { BaseTooltip } from './base';
///<reference path='../core/selection.ts' />
//import { Range } from '../core/selection';
///<reference path='../ui/icons.ts' />
//import icons from '../ui/icons';
var TOOLBAR_CONFIG = [
    ['bold', 'italic', 'link'],
    [{ header: 1 }, { header: 2 }, 'blockquote']
];
var BubbleTheme = (function (_super) {
    __extends(BubbleTheme, _super);
    function BubbleTheme(quill, options) {
        var _this;
        if (options.modules.toolbar != null && options.modules.toolbar.container == null) {
            options.modules.toolbar.container = TOOLBAR_CONFIG;
        }
        _this = _super.call(this, quill, options) || this;
        _this.quill.container.classList.add('ql-bubble');
        return _this;
    }
    BubbleTheme.prototype.extendToolbar = function (toolbar) {
        this.tooltip = new BubbleTooltip(this.quill, this.options.bounds);
        this.tooltip.root.appendChild(toolbar.container);
        this.buildButtons([].slice.call(toolbar.container.querySelectorAll('button')), icons);
        this.buildPickers([].slice.call(toolbar.container.querySelectorAll('select')), icons);
    };
    return BubbleTheme;
}(BaseTheme));
BubbleTheme.DEFAULTS = extend(true, {}, BaseTheme.DEFAULTS, {
    modules: {
        toolbar: {
            handlers: {
                link: function (value) {
                    if (!value) {
                        this.quill.format('link', false);
                    }
                    else {
                        this.quill.theme.tooltip.edit();
                    }
                }
            }
        }
    }
});
var BubbleTooltip = (function (_super) {
    __extends(BubbleTooltip, _super);
    function BubbleTooltip(quill, bounds) {
        var _this = _super.call(this, quill, bounds) || this;
        _this.quill.on(Emitter.events.EDITOR_CHANGE, function (type, range) {
            if (type !== Emitter.events.SELECTION_CHANGE)
                return;
            if (range != null && range.length > 0) {
                _this.show();
                // Lock our width so we will expand beyond our offsetParent boundaries
                _this.root.style.left = '0px';
                _this.root.style.width = '';
                _this.root.style.width = _this.root.offsetWidth + 'px';
                var lines = _this.quill.scroll.lines(range.index, range.length);
                if (lines.length === 1) {
                    _this.position(_this.quill.getBounds(range));
                }
                else {
                    var lastLine = lines[lines.length - 1];
                    var index = lastLine.offset(_this.quill.scroll);
                    var length_2 = Math.min(lastLine.length() - 1, range.index + range.length - index);
                    var bounds_1 = _this.quill.getBounds(new Range(index, length_2));
                    _this.position(bounds_1);
                }
            }
            else if (document.activeElement !== _this.textbox && _this.quill.hasFocus()) {
                _this.hide();
            }
        });
        return _this;
    }
    BubbleTooltip.prototype.listen = function () {
        var _this = this;
        _super.prototype.listen.call(this);
        this.root.querySelector('.ql-close').addEventListener('click', function () {
            _this.root.classList.remove('ql-editing');
        });
        this.quill.on(Emitter.events.SCROLL_OPTIMIZE, function () {
            // Let selection be restored by toolbar handlers before repositioning
            setTimeout(function () {
                if (_this.root.classList.contains('ql-hidden'))
                    return;
                var range = _this.quill.getSelection();
                if (range != null) {
                    _this.position(_this.quill.getBounds(range));
                }
            }, 1);
        });
    };
    BubbleTooltip.prototype.cancel = function () {
        this.show();
    };
    BubbleTooltip.prototype.position = function (reference) {
        var shift = _super.prototype.position.call(this, reference);
        var arrow = this.root.querySelector('.ql-tooltip-arrow');
        arrow.style.marginLeft = '';
        if (shift === 0)
            return shift;
        arrow.style.marginLeft = (-1 * shift - arrow.offsetWidth / 2) + 'px';
    };
    return BubbleTooltip;
}(BaseTooltip));
BubbleTooltip.TEMPLATE = [
    '<span class="ql-tooltip-arrow"></span>',
    '<div class="ql-tooltip-editor">',
    '<input type="text" data-formula="e=mc^2" data-link="quilljs.com" data-video="Embed URL">',
    '<a class="ql-close"></a>',
    '</div>'
].join('');
// export { BubbleTooltip, BubbleTheme as default }; 
//import extend from 'extend';
///<reference path='../core/emitter.ts' />
//import Emitter from '../core/emitter';
///<reference path='./base.ts' />
//import BaseTheme, { BaseTooltip } from './base';
///<reference path='../formats/link.ts' />
//import LinkBlot from '../formats/link';
///<reference path='../core/selection.ts' />
//import { Range } from '../core/selection';
///<reference path='../ui/icons.ts' />
//import icons from '../ui/icons';
var TOOLBAR_CONFIG = [
    [{ header: ['1', '2', '3', false] }],
    ['bold', 'italic', 'underline', 'link'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean']
];
var SnowTheme = (function (_super) {
    __extends(SnowTheme, _super);
    function SnowTheme(quill, options) {
        var _this;
        if (options.modules.toolbar != null && options.modules.toolbar.container == null) {
            options.modules.toolbar.container = TOOLBAR_CONFIG;
        }
        _this = _super.call(this, quill, options) || this;
        _this.quill.container.classList.add('ql-snow');
        return _this;
    }
    SnowTheme.prototype.extendToolbar = function (toolbar) {
        toolbar.container.classList.add('ql-snow');
        this.buildButtons([].slice.call(toolbar.container.querySelectorAll('button')), /*icons*/ ICONS);
        this.buildPickers([].slice.call(toolbar.container.querySelectorAll('select')), /*icons*/ ICONS);
        this.tooltip = new SnowTooltip(this.quill, this.options.bounds);
        if (toolbar.container.querySelector('.ql-link')) {
            this.quill.keyboard.addBinding({ key: 'K', shortKey: true }, function (range, context) {
                toolbar.handlers['link'].call(toolbar, !context.format.link);
            });
        }
    };
    return SnowTheme;
}(BaseTheme));
SnowTheme.DEFAULTS = extend(true, {}, BaseTheme.DEFAULTS, {
    modules: {
        toolbar: {
            handlers: {
                link: function (value) {
                    if (value) {
                        var range = this.quill.getSelection();
                        if (range == null || range.length == 0)
                            return;
                        var preview = this.quill.getText(range);
                        if (/^\S+@\S+\.\S+$/.test(preview) && preview.indexOf('mailto:') !== 0) {
                            preview = 'mailto:' + preview;
                        }
                        var tooltip = this.quill.theme.tooltip;
                        tooltip.edit('link', preview);
                    }
                    else {
                        this.quill.format('link', false);
                    }
                }
            }
        }
    }
});
var SnowTooltip = (function (_super) {
    __extends(SnowTooltip, _super);
    function SnowTooltip(quill, bounds) {
        var _this = _super.call(this, quill, bounds) || this;
        _this.preview = _this.root.querySelector('a.ql-preview');
        return _this;
    }
    SnowTooltip.prototype.listen = function () {
        var _this = this;
        _super.prototype.listen.call(this);
        this.root.querySelector('a.ql-action').addEventListener('click', function (event) {
            if (_this.root.classList.contains('ql-editing')) {
                _this.save();
            }
            else {
                _this.edit('link', _this.preview.textContent);
            }
            event.preventDefault();
        });
        this.root.querySelector('a.ql-remove').addEventListener('click', function (event) {
            if (_this.linkRange != null) {
                _this.restoreFocus();
                _this.quill.formatText(_this.linkRange, 'link', false, Emitter.sources.USER);
                delete _this.linkRange;
            }
            event.preventDefault();
            _this.hide();
        });
        this.quill.on(Emitter.events.SELECTION_CHANGE, function (range) {
            if (range == null)
                return;
            if (range.length === 0) {
                var _a = _this.quill.scroll.descendant(/*LinkBlot*/ Link, range.index), link_1 = _a[0], offset = _a[1];
                if (link_1 != null) {
                    _this.linkRange = new Range(range.index - offset, link_1.length());
                    var preview = Link.formats(link_1.domNode);
                    _this.preview.textContent = preview;
                    _this.preview.setAttribute('href', preview);
                    _this.show();
                    _this.position(_this.quill.getBounds(_this.linkRange));
                    return;
                }
            }
            else {
                delete _this.linkRange;
            }
            _this.hide();
        });
    };
    SnowTooltip.prototype.show = function () {
        _super.prototype.show.call(this);
        this.root.removeAttribute('data-mode');
    };
    return SnowTooltip;
}(BaseTooltip));
SnowTooltip.TEMPLATE = [
    '<a class="ql-preview" target="_blank" href="about:blank"></a>',
    '<input type="text" data-formula="e=mc^2" data-link="quilljs.com" data-video="Embed URL">',
    '<a class="ql-action"></a>',
    '<a class="ql-remove"></a>'
].join('');
// export default SnowTheme; 
///<reference path='./core.ts' />
//import Quill from './core';
//import { AlignClass, AlignStyle } from './formats/align';
//import { DirectionAttribute, DirectionClass, DirectionStyle } from './formats/direction';
///<reference path='./formats/indent.ts' />
//import { IndentClass as Indent } from './formats/indent';
//import Blockquote from './formats/blockquote';
//import Header from './formats/header';
//import List, { ListItem } from './formats/list';
//import { BackgroundClass, BackgroundStyle } from './formats/background';
//import { ColorClass, ColorStyle } from './formats/color';
//import { FontClass, FontStyle } from './formats/font';
//import { SizeClass, SizeStyle } from './formats/size';
//import Bold from './formats/bold';
//import Italic from './formats/italic';
//import Link from './formats/link';
//import Script from './formats/script';
//import Strike from './formats/strike';
//import Underline from './formats/underline';
//import Image from './formats/image';
//import Video from './formats/video';
//import CodeBlock, { Code as InlineCode } from './formats/code';
//import Formula from './modules/formula';
//import Syntax from './modules/syntax';
//import Toolbar from './modules/toolbar';
//import Icons from './ui/icons';
//import Picker from './ui/picker';
//import ColorPicker from './ui/color-picker';
//import IconPicker from './ui/icon-picker';
//import Tooltip from './ui/tooltip';
///<reference path='./themes/bubble.ts' />
//import BubbleTheme from './themes/bubble';
///<reference path='./themes/snow.ts' />
//import SnowTheme from './themes/snow';
Quill.register({
    'attributors/attribute/direction': DirectionAttribute,
    'attributors/class/align': AlignClass,
    'attributors/class/background': BackgroundClass,
    'attributors/class/color': ColorClass,
    'attributors/class/direction': DirectionClass,
    'attributors/class/font': FontClass,
    'attributors/class/size': SizeClass,
    'attributors/style/align': AlignStyle,
    'attributors/style/background': BackgroundStyle,
    'attributors/style/color': ColorStyle,
    'attributors/style/direction': DirectionStyle,
    'attributors/style/font': FontStyle,
    'attributors/style/size': SizeStyle
}, true);
Quill.register({
    'formats/align': AlignClass,
    'formats/direction': DirectionClass,
    'formats/indent': /*Indent*/ IndentClass,
    'formats/background': BackgroundStyle,
    'formats/color': ColorStyle,
    'formats/font': FontClass,
    'formats/size': SizeClass,
    'formats/blockquote': Blockquote,
    'formats/code-block': CodeBlock,
    'formats/header': Header,
    'formats/list': List,
    'formats/bold': Bold,
    'formats/code': /*InlineCode*/ Code,
    'formats/italic': Italic,
    'formats/link': Link,
    'formats/script': Script,
    'formats/strike': Strike,
    'formats/underline': Underline,
    'formats/image': Image,
    'formats/video': Video,
    'formats/list/item': ListItem,
    'modules/formula': Formula,
    'modules/syntax': Syntax,
    'modules/toolbar': Toolbar,
    'themes/bubble': BubbleTheme,
    'themes/snow': SnowTheme,
    'ui/icons': /*Icons*/ ICONS,
    'ui/picker': Picker,
    'ui/icon-picker': IconPicker,
    'ui/color-picker': ColorPicker,
    'ui/tooltip': Tooltip
}, true);
// module.exports = Quill; 
//# sourceMappingURL=out.js.map