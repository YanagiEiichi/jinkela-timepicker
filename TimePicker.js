var TimePicker;

{

  // 选项
  class Item extends Jinkela {
    init() {
      if (typeof this.value === 'number') {
        this.element.jinkela = this;
        this.element.textContent = (this.value < 10 ? '0' : '') + this.value;
      }
    }
    get styleSheet() {
      return `
        :scope {
          cursor: pointer;
          display: block;
          text-align: center;
          text-decoration: none;
          color: inherit;
          height: 32px;
          &.active {
            color: #20a0ff;
            font-weight: 500;
            font-size: 16px;
          }
          &:hover {
            color: #20a0ff;
          }
        }
      `;
    }
    get state() { return this.element.classList.contains('active'); }
    set state(state) { this.element.classList[state === 'active' ? 'add' : 'remove']('active'); }
    get top() { return this.element.offsetTop; }
  }

  // 孔洞
  class Aperture extends Jinkela {
    init() {
      if ('left' in this) this.element.style.left = this.left;
      if ('right' in this) this.element.style.right = this.right;
    }
    get styleSheet() {
      return `
        :scope {
          position: absolute;
          pointer-events: none;
          box-sizing: border-box;
          font-size: 16px;
          width: 36px;
          height: 36px;
          border: 1px solid #20a0ff;
          box-shadow: 0 0 10px #20a0ff;
          border-radius: 100%;
          top: 0;
          bottom: 0;
          margin: auto;
        }
      `;
    }
  }

  // 列
  class Column extends Jinkela {
    get styleSheet() {
      return `
        :scope {
          position: relative;
          height: 224px;
          -ms-overflow-style: none;
          overflow: -moz-scrollbars-none;
          overflow-y: scroll;
          &::-webkit-scrollbar { width:0px; }
          margin: 0;
          padding: 0;
          float: left;
          width: 74px;
        }
      `;
    }
    init() {
      this.element.addEventListener('scroll', () => this.scroll());
      this.element.addEventListener('mouseleave', () => this.mouseleave());
      this.element.addEventListener('click', event => this.click(event));
    }
    get list() {
      let list = [];
      for (let i = 0; i < 3; i++) new Item().to(this);
      for (let i = 0; i < 3; i++) {
        for (let value = this.min; value <= this.max; value++) list.push(new Item({ value }).to(this));
      }
      for (let i = 0; i < 3; i++) new Item().to(this);
      Object.defineProperty(this, 'list', { value: list, configurable: true });
      return list;
    }
    click({ target }) { if (target.jinkela instanceof Item) this.value = target.jinkela.value; }
    mouseleave() { this.value = this.value; }
    scroll() {
      if (this.lock) return;
      let index = Math.round(this.element.scrollTop / 32);
      this.activeItem = this.list[index];
      if (index === 0 || index === this.list.length - 1) this.value = this.value;
      if (typeof this.onChange === 'function') this.onChange();
    }
    get value() { return this.activeItem.value % (this.max + 1); }
    set value(index) {
      index += this.max + 1;
      this.activeItem = this.list[index];
      this.lock = true;
      this.element.scrollTop = this.activeItem.top - 32 * 3;
      this.lock = false;
    }
    get activeItem() { return this.$activeItem || this.list[0]; }
    set activeItem(item) {
      if (this.$activeItem === item) return;
      if (this.$activeItem) this.$activeItem.state = '';
      this.$activeItem = item;
      item.state = 'active';
    }
  }

  // 对话框
  class Panel extends Jinkela {
    init() {
      // 绑定一堆事件
      this.element.addEventListener('click', event => (event.relatedTimePicker = this.binding));
      // 初始化后代的三列
      let onChange = this.change.bind(this);
      this.hours = new Column({ min: 0, max: 23, onChange }).to(this);
      this.minutes = new Column({ min: 0, max: 59, onChange }).to(this);
      this.seconds = new Column({ min: 0, max: 59, onChange }).to(this);
      // 初始化三个孔洞
      new Aperture({ left: '18px' }).to(this);
      new Aperture({ left: 0, right: 0 }).to(this);
      new Aperture({ right: '18px' }).to(this);
    }
    change() {
      this.binding.change(this.value);
    }
    get value() {
      let args = [];
      if (this.hours) args.push(this.hours.value);
      if (this.minutes) args.push(this.minutes.value);
      if (this.seconds) args.push(this.seconds.value);
      return args;
    }
    set value(value) {
      value = value || [];
      if ('0' in value) this.hours.value = +value[0];
      if ('1' in value) this.minutes.value = +value[1];
      if ('2' in value) this.seconds.value = +value[2];
    }
    updatePosition() {
      let rect = this.binding.element.getBoundingClientRect();
      this.element.style.top = rect.top + rect.height + 'px';
      this.element.style.left = rect.left + 'px';
    }
    startFixPositionWhileScroll() {
      if (this.scroll) return; // Avoid duplicate listen
      let scroll = event => {
        console.log(event);
        if (document.body.contains(this.element)) {
          this.updatePosition();
        } else {
          removeEventListener('scroll', scroll, true);
          delete this.scroll;
        }
      };
      this.scroll = scroll;
      addEventListener('scroll', scroll, true);
    }
    show() {
      this.to(document.body);
      this.startFixPositionWhileScroll();
      this.updatePosition();
      let click = event => {
        if (event.relatedTimePicker === this.binding) return;
        // 检测到是否点了自己，然后阻止操作
        this.element.remove();
        removeEventListener('click', click);
      };
      addEventListener('click', click);
    }
    get styleSheet() {
      return `
        :scope {
          position: fixed;
          z-index: 2;
          background: #fff;
          top: 100%;
          left: 0;
          font-size: 12px;
          line-height: 32px;
          display: inline-block;
          margin-top: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,.12), 0 0 6px rgba(0,0,0,.04);
          border: 1px solid #d1dbe5;
          border-radius: 2px;
        }
      `;
    }
  }

  // 控件显示的内容
  class Field extends Jinkela {
    set text(value) { this.element.value = value; }
    get text() { return this.element.value; }
    get template() { return '<input readonly="readonly" />'; }
    get styleSheet() {
      return `
        :scope {
          width: 100%;
          position: relative;
          border: 1px solid #bfcbd9;
          border-radius: 4px;
          line-height: 1;
          box-sizing: border-box;
          background: #fff;
          height: 36px;
          transition: border-color .2s cubic-bezier(.645,.045,.355,1);
          display: inline-block;
          padding: 3px 10px;
          outline: 0;
          font-family: inherit;
          &:hover {
            border-color: #8391a5;
          }
        }
      `;
    }
  }

  // 入口
  TimePicker = class TimePicker extends Jinkela {
    get Field() { return Field; }

    // 当获取焦点时需要显示的浮层
    get panel() {
      let value = new Panel({ binding: this });
      Object.defineProperty(this, 'panel', { value, configurable: true });
      return value;
    }

    // 入口
    init() {
      // 初始化一波事件
      this.element.addEventListener('click', event => (event.relatedTimePicker = this));
      this.element.addEventListener('focus', this.focus.bind(this), true);

      // 强行让对应的 DOM 元素也支持 value 属性（某些神奇的场景下会用到）
      Object.defineProperty(this.element, 'value', { get: () => this.value, set: value => (this.value = value) });

      // 初始化
      if (!this.$hasValue) this.value = void 0;
      this.updateText();
    }

    focus() {
      this.panel.show();
      this.value = this.value;
    }
    onChange() { /* To Override */ }
    updateText() {
      this.field.text = this.value || this.defaultText || '';
    }
    change() {
      this.updateText();
      if (this.$value !== this.value) {
        this.$value = this.value;
        this.onChange();
      }
    }

    get width() { return this.element.getAttribute('width'); }
    set width(value) { this.element.style.setProperty('width', value); }

    get value() {
      let value = this.panel.value;
      if (value == null) return value; // eslint-disable-line eqeqeq
      return value.join(':').replace(/\b\d\b/g, '0$&');
    }
    set value(value = this.defaultValue) {
      // 处理传入的不明类型数据
      if (typeof value === 'string') value = value.match(/\d+/g);
      if (!(value instanceof Array)) value = [ 0, 0, 0 ];
      // 双向更新
      this.panel.value = value;
      this.updateText();
      this.$hasValue = true;
    }

    get template() {
      return `
        <span>
          <jkl-field ref="field"></jkl-field>
          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <path d="
              M525 230 437 230 438 639 760 639 760 552 525 552Z
              M512 42c-265 0-480 214-480 480 0 265 214 480 480 480s480-214 480-480C992 257 777 42 512 42z
              M512 915c-216 0-392-175-392-392C119 305 295 129 512 129c216 0 392 175 392 392C904 739 728 915 512 915z
            "></path>
          </svg>
        </span>
      `;
    }
    get styleSheet() {
      return `
        :scope {
          width: 106px;
          font-size: 14px;
          font-family: Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Microsoft YaHei, SimSun, sans-serif;
          -webkit-font-smoothing: antialiased;
          position: relative;
          display: inline-block;
          > div { display: none; }
          &:focus > input { border-color: #20a0ff; }
          > svg {
            position: absolute;
            width: 16px;
            height: 16px;
            right: 8px;
            top: 0;
            bottom: 0;
            margin: auto;
            fill: #bfcbd9;
            z-index: 1;
          }
        }
      `;
    }
  }

}
