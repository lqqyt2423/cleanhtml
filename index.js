'use strict';

const htmlparser = require('htmlparser2');

// 需要忽略的 html 元素
const voidElements = ['head', 'meta', 'link', 'area', 'base', 'br', 'col', 'command', 'embed', 'input', 'keygen', 'param', 'source', 'track', 'wbr', 'script', 'title', 'style'];

// 替换为 p 的元素
const toPElements = ['p', 'div', 'header', 'section', 'article', 'aside', 'footer', 'nav'];

// 忽略标签，不忽略内容
const toTextElements = ['span', 'html', 'body'];

// 序列化 attr
const attrStringify = (attr) => {
  return '';
  const a = [];
  Object.keys(attr).forEach((key) => {
    const val = attr[key];

    // replace
    if (!attr.src && /src/.test(key)) {
      key = 'src';
      attr.src = val;
    }

    const keepKeys = ['href', 'title', 'alt', 'src'];
    if (keepKeys.indexOf(key) === -1) return;

    if (val) a.push(`${key}="${attr[key]}"`);
  });
  return a.join(' ');
};

class Stack {
  constructor() {
    this.stack = [];
  }
  in(i) {
    this.stack.push(i);
    // console.log(this.stack.join(', '));
  }

  out() {
    const i = this.stack.pop();
    // console.log('out:', i);
    return i;
  }
}

module.exports = function cleanhtml(html) {
  // 控制 stack
  const stack = new Stack();

  // 最终返回的字符
  let str = '';

  // 控制忽略元素
  const voidObj = {};
  voidElements.forEach((item) => {
    voidObj[item] = false;
  });

  // 忽略 display 为 none 的元素及其子元素
  let isHide = false;
  // 隐藏后的计数，当再次为0时，隐藏标签结束
  let hideCount = 0;
  const hideRegex = /display:\s*?none/;


  const parser = new htmlparser.Parser({

    onopentag(name, attr) {
      name = name.toLowerCase();

      // 忽略此元素标签
      if (toTextElements.indexOf(name) > -1) return;

      // 忽略元素及其中的内容，包括子元素
      if (voidElements.indexOf(name) > -1) {
        voidObj[name] = true;
        return;
      }
      for (const item of voidElements) {
        if (voidObj[item]) return;
      }

      // 忽略 display 为 none 的元素及其子元素
      if (isHide) {
        hideCount += 1;
        return;
      }
      if (attr.style) {
        if (hideRegex.test(attr.style)) {
          isHide = true;
          hideCount += 1;
          return;
        }
      }

      // img 标签
      if (name === 'img') {
        let attrString = attrStringify(attr);
        if (attrString) attrString = ` ${attrString}`;
        str += `<img${attrString} />`;
        return;
      }

      // a 标签
      if (name === 'a') {
        let attrString = attrStringify(attr);
        if (attrString) attrString = ` ${attrString}`;
        str += `<a${attrString}>`;
        stack.in(name);
        return;
      }

      // 替换块状元素为 p 的元素
      let tag = name;
      if (toPElements.indexOf(name) > -1) {
        tag = 'p';
      }

      // 处理属性
      // const attrArr = [];
      // Object.keys(attr).forEach((key) => {
      //   key = key.toLowerCase();
      //   if (key === 'style') {
      //     // 仅保留color
      //     let val = attr.style;
      //     if (/color:.+?;/.test(val)) {
      //       val = val.match(/color:.+?;/)[0];
      //       attrArr.push(`style="${val}"`);
      //     }
      //   } else {
      //     attrArr.push(`${key}="${attr[key]}"`);
      //   }
      // });

      // if (attrArr.length) {
      //   str += `<${tag} ${attrArr.join(' ')}>`;
      //   return;
      // }

      stack.in(tag);
      str += `<${tag}>`;
    },

    onclosetag(name) {
      name = name.toLowerCase();

      // 忽略此元素标签
      if (toTextElements.indexOf(name) > -1) return;

      // 忽略元素及其中的内容，包括子元素
      if (voidElements.indexOf(name) > -1) {
        voidObj[name] = false;
        return;
      }
      for (const item of voidElements) {
        if (voidObj[item]) return;
      }

      // 忽略 display 为 none 的元素及其子元素
      if (isHide) {
        hideCount -= 1;
        if (hideCount === 0) {
          isHide = false;
        }
        return;
      }

      // img 标签
      if (name === 'img') {
        return;
      }

      // 替换块状元素为 p 的元素
      let tag = name;
      if (toPElements.indexOf(name) > -1) {
        tag = 'p';
      }

      stack.out();
      str += `</${tag}>`;
      if (tag === 'p') str += '\n';
    },

    ontext(text) {
      // 忽略元素及其中的内容，包括子元素
      for (const item of voidElements) {
        if (voidObj[item]) return;
      }

      // 忽略 display 为 none 的元素及其子元素
      if (isHide) return;

      text = text.trim();
      str += text;
    },
  }, { decodeEntities: false });

  parser.end(html);

  return str;
};
