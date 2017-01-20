{

  class Item extends Jinkela {
    beforeParse(params) {
      if (params.text === void 0) params.text = (params.value < 10 ? '0' : '') + params.value;
    }
    get template() { return `<a href="JavaScript:" class="{state}">{text}</a>`; }
    get styleSheet() {
      return `
        :scope {
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
        }
      `;
    }
  }

  class Aperture extends Jinkela {
    init() {
      if ('left' in this) this.element.style.left = this.left;
      if ('right' in this) this.element.style.right = this.right;
    }
    get styleSheet() {
      return `
        :scope {
          position: absolute;
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

  class Column extends Jinkela {
    get tagName() { return 'ol'; }
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
    beforeParse() {
      this.lock = 0;
      this.list = [];
    }
    beforeExtends() {
      for (let i = 0; i < 3; i++) new Item({ text: '' }).to(this);
      for (let i = 0; i < 3; i++)
        for (let value = this.min; value <= this.max; value++) this.list.push(new Item({ value }).to(this));
      for (let i = 0; i < 3; i++) new Item({ text: '' }).to(this);
    }
    init() {
      this.scroll();
      this.element.addEventListener('scroll', () => this.scroll());
      this.element.addEventListener('mouseleave', () => this.mouseleave());
      this.element.addEventListener('click', event => this.click(event));
    }
    click({ target }) {
      if (target.tagName !== 'A') return;
      let value = +target.textContent;
      if (value === value) this.value = value;
    }
    mouseleave() {
      this.value = this.value;
    }
    scroll() {
      if (this.lock) return;
      let index = Math.round(this.element.scrollTop / 32);
      this.activeItem = this.list[index];
      // clearTimeout(this.timer);
      // this.timer = setTimeout(() => this.value = this.value, 200);
      if (typeof this.onChange === 'function') this.onChange();
    }
    setScrollTop(scrollTop) {
      this.lock++;
      this.element.scrollTop = scrollTop;
      this.lock--;
    }
    get value() { return this.activeItem.value % (this.max + 1); }
    set value(index) {
      index += this.max + 1;
      let scrollTop = index * 32;
      this.setScrollTop(scrollTop);
      if (this.element.scrollTop !== scrollTop) setTimeout(() => this.value = this.value, 16);
      this.activeItem = this.list[index];
    }
    get activeItem() { return this.$activeItem; }
    set activeItem(item) {
      if (this.$activeItem === item) return;
      if (this.$activeItem) this.$activeItem.state = '';
      this.$activeItem = item;
      item.state = 'active';
    }
  }

  class Hours extends Column {
    get min() { return 0; }
    get max() { return 23; }
  }

  class Minutes extends Column {
    get min() { return 0; }
    get max() { return 59; }
  }

  class Seconds extends Column {
    get min() { return 0; }
    get max() { return 59; }
  }

  class TimePickerPanel extends Jinkela {
    beforeParse(params) {
      let onChange = this.update.bind(this);
      this.hours = new Hours({ onChange });
      this.minutes = new Minutes({ onChange });
      this.seconds = new Seconds({ onChange });
    }
    init() {
      this.hours.to(this);
      this.minutes.to(this);
      this.seconds.to(this);
      new Aperture({ left: '18px' }).to(this);
      new Aperture({ left: 0, right: 0 }).to(this);
      new Aperture({ right: '18px' }).to(this);
      this.update();
    }
    update() {
      let args = [];
      if (this.hours) args.push(this.hours.value);
      if (this.minutes) args.push(this.minutes.value);
      if (this.seconds) args.push(this.seconds.value);
      this.$value = args;
      if (typeof this.onChange === 'function') this.onChange(args);
    }
    get value() { return this.$value; }
    set value(value) {
      value = value || [];
      this.$value = value;
      if ('0' in value) this.hours.value = +value[0];
      if ('1' in value) this.minutes.value = +value[1];
      if ('2' in value) this.seconds.value = +value[2];
    }
    get styleSheet() {
      return `
        :scope {
          position: absolute;
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

  class TimePickerField extends Jinkela {
    set text(value) { this.element.value = value; }
    get text() { return this.element.value; }
    get template() { return '<input placeholder="{placeholder}" readonly="readonly" />'; }
    get styleSheet() {
      return `
        :scope {
          width: 226px;
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

  class TimePicker extends Jinkela {
    beforeParse(params) {
      let onChange = this.change.bind(this);
      params.placeholder = 'placeholder' in params ? params.placeholder : '请选择时间';
      this.field = new TimePickerField(params);
      this.panel = new TimePickerPanel({ onChange });
      if (!('value' in params)) params.value = [ 0, 0, 0 ];
    }
    init() {
      this.field.to(this);
      this.panel.to(this);
      this.update();
      addEventListener('click', event => this.checkClose(event));
      this.element.addEventListener('click', event => event.relatedTimePicker = this);
      this.element.addEventListener('focus', () => this.element.className = 'active', true);
      Object.defineProperty(this.element, 'value', { get: () => this.value, set: value => this.value = value });
    }
    onChange() {}
    checkClose(event) {
      if (!this.element.className) return;
      let { target } = event;
      if (event.relatedTimePicker === this) return;
      this.element.className = '';
    }
    update() { this.field.text = this.value || this.defaultText || ''; }
    change() {
      if (!this.panel) return;
      this.update();
      if (this.$value !== this.value) {
        this.$value = this.value;
        this.onChange();
      }
    }
    set placeholder(value) { this.field.placeholder = value; }
    get placeholder() { return this.field.placeholder; }
    set starting(value) { this.panel.starting = value; }
    get starting() { return this.panel.strting; }
    get value() {
      let value = this.panel.value;
      if (value == null) return value; // eslint-disable-line eqeqeq
      return value.join(':').replace(/\b\d\b/g, '0$&');
    }
    set value(value) {
      if (typeof value === 'string') value = value.match(/\d+/g);
      if (!(value instanceof Array)) value = [ 0, 0, 0 ];
      this.panel.value = value;
      this.update();
    }
    get template() {
      return `
        <span>
          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <path d="M525 230 437 230 438 639 760 639 760 552 525 552Z"></path>
            <path d="M512 42c-265 0-480 214-480 480 0 265 214 480 480 480s480-214 480-480C992 257 777 42 512 42zM512 915c-216 0-392-175-392-392C119 305 295 129 512 129c216 0 392 175 392 392C904 739 728 915 512 915z"></path>
          </svg>
        </span>
      `;
    }
    get styleSheet() {
      return `
        :scope {
          font-size: 14px;
          font-family: Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Microsoft YaHei, SimSun, sans-serif;
          -webkit-font-smoothing: antialiased;
          position: relative;
          display: inline-block;
          > div { display: none; }
          &.active > input { border-color: #20a0ff; }
          &.active > div { display: block; }
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

  window.TimePicker = TimePicker;

}
