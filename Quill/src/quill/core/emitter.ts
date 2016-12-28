﻿// import EventEmitter from 'eventemitter3';

///<reference path='./logger.ts' />
// import logger from './logger';

let debug = /*logger*/_namespace('quill:events');


class Emitter extends EventEmitter {
    static events = {
        EDITOR_CHANGE: 'editor-change',
        SCROLL_BEFORE_UPDATE: 'scroll-before-update',
        SCROLL_OPTIMIZE: 'scroll-optimize',
        SCROLL_UPDATE: 'scroll-update',
        SELECTION_CHANGE: 'selection-change',
        TEXT_CHANGE: 'text-change'
    };
    static sources = {
        API: 'api',
        SILENT: 'silent',
        USER: 'user'
    };

    constructor() {
        super();
        this.on('error', debug.error);
    }

    emit() {
        // debug.log.apply(debug, arguments);
        super.emit.apply(this, arguments);
    }
}

//Emitter.events = {
//    EDITOR_CHANGE: 'editor-change',
//    SCROLL_BEFORE_UPDATE: 'scroll-before-update',
//    SCROLL_OPTIMIZE: 'scroll-optimize',
//    SCROLL_UPDATE: 'scroll-update',
//    SELECTION_CHANGE: 'selection-change',
//    TEXT_CHANGE: 'text-change'
//};
//Emitter.sources = {
//    API: 'api',
//    SILENT: 'silent',
//    USER: 'user'
//};


// export default Emitter;