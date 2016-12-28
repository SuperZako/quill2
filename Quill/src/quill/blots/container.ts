// import Parchment from 'parchment';

///<reference path='./block.ts' />
// import Block, { BlockEmbed } from './block';


class Container extends /*Parchment.*/ContainerBlot { }
Container.allowedChildren = [Block, BlockEmbed, Container];


// export default Container;