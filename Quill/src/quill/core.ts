
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
    'modules/history': _History,
    'modules/keyboard': Keyboard
});

Parchment.register(Block, Break, Cursor, Inline, Scroll, TextBlot);


// module.exports = Quill;