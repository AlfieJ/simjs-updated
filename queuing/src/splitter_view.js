class SplitterView {
  constructor(canvas, type, name, x, y, hasIn, hasOut) {
    this.canvas = canvas;
    this.type = type;
    this.name = name;

    this.hidden = [canvas.rect(x, y, 10, 10), canvas.rect(x, y, 10, 10)];
    this.width = 41 * 0.7;
    this.height = 48 * 0.7;
    this.image = canvas.image('images/splitter.png', x, y, this.width, this.height);


    this.x = x;
    this.y = y;

    this.hidden[0].attr({'stroke-width': '0'});
    this.hidden[1].attr({'stroke-width': '0'});
    this.image.attr({cursor: 'move'});
    this.image.view = this;
    this.image.animate({scale: "1.2 1.2"}, 200, function () {
      this.animate({scale: "1 1"}, 200);
    });

    this.arrows = [null, null];
    this.counters = canvas.text(x, y, '');

    for (let i = 0; i < 2; i ++) {
      const arrow = canvas.image("images/orange-arrow.gif", x, y, 12, 12);
      arrow.view = this;
      arrow.id = i;
      arrow.drag(
        function (dx, dy) {
          this.attr({x: this.ox + dx, y: this.oy + dy});
          this.paper.connection(this.conn);
        },
        function () {
          const from = this.view.hidden[this.id];
          this.conn = this.paper.connection(from, this, "#000");
          this.ox = this.attr("x");
          this.oy = this.attr("y");
        },
        function () {
          this.conn.line.remove();
          this.conn = null;

          const views = QueueApp.views;
          const len = views.length;
          const x = this.attr('x');
          const y = this.attr('y');

          for (let i = len - 1; i >= 0; i--) {
            const obj = views[i];
            if (obj.acceptDrop(x, y)) {
              this.hide();
              this.view.connect(obj, this.id);
              return;
            }
          }

          const view = this.view;
          if (this.id === 0) {
            this.attr({x: view.x + view.width + 2, y: view.y + 5});
          } else {
            this.attr({x: view.x + view.width + 2, y: view.y + view.height - 15});
          }
        });
      this.arrows[i] = arrow;
    }

    // move
    this.moveto(x, y);

    // Set up event listeners
    this.image.drag(
      function (dx, dy) {
        const view = this.view;
        view.moveto(view.ox + dx, view.oy + dy);
      },
      function () {
        const view = this.view;
        view.ox = view.x;
        view.oy = view.y;
      },
      () => {

      });

    this.image.dblclick(function () {
      this.view.model.showSettings();
    });
  }

  moveto(x, y) {
    var len;
    var i;
    let dot;

    if (x > 600 - this.width || y > 400 - this.height || x < 0 || y < 0) {
      return;
    }

    this.x = x;
    this.y = y;

    this.image.attr({x, y});

    this.hidden[0].attr({x: this.x + this.width - 20,
               y: this.y + 5});
    this.hidden[1].attr({x: this.x + this.width - 20,
               y: this.y + this.height - 15});


    this.arrows[0].attr({x: this.x + this.width + 2, y: this.y + 5});
    this.arrows[1].attr({x: this.x + this.width + 2, y: this.y + this.height - 15});
    this.counters.attr({x: this.x + this.width / 2, y: this.y + this.height + 5})

    var len = QueueApp.views.length;
    for (var i = len - 1; i >= 0; i--) {
      QueueApp.views[i].moveConnection(this);
    }

    if (this.arrows[0].conn) this.canvas.connection(this.arrows[0].conn);
    if (this.arrows[1].conn) this.canvas.connection(this.arrows[1].conn);
  }

  connect(to, channel) {
    const conn = this.canvas.connection(this.hidden[channel], to.dropObject(), "#000");
    conn.line.attr({'stroke-width': 3, 'stroke': '#F7D68A'});
    conn.fromView = this;
    conn.toView = to;
    this.arrows[channel].conn = conn;
    this.arrows[channel].hide();
    this.model.dest[channel] = to.model;
  }

  unlink() {
    var i;
    var len;
    let index;

    len = QueueApp.models.length;
    for (i = len - 1; i >= 0; i--) {
      if (QueueApp.models[i] === this.model) {
        index = i;
        break;
      }
    }

    if (index) QueueApp.models.splice(index, 1);
    if (this.model) this.model.unlink();
    this.disconnect();
    var len = QueueApp.views.length;
    for (var i = len - 1; i >= 0; i--) {
      QueueApp.views[i].disconnect(this);
      if (QueueApp.views[i] === this) index = i;
    }

    QueueApp.views.splice(index, 1);

    this.image.remove();
    this.arrows[0].remove();
    this.arrows[1].remove();
    this.hidden[0].remove();
    this.hidden[0].remove();
    this.counters.remove();
  }

  disconnect(dest) {
    for (let i = 0; i < 2; i ++) {
      const arrow = this.arrows[i];
      if (arrow && arrow.conn && (!dest || arrow.conn.toView === dest)) {
        arrow.conn.line.remove();
        arrow.conn = null;

        if (i === 0) {
          arrow.attr({x: this.x + this.width + 2, y: this.y + 5});
        } else {
          arrow.attr({x: this.x + this.width + 2, y: this.y + this.height - 15});
        }
        arrow.show();
      }
    }
  }

  dropObject() {
    return this.image;
  }

  acceptDrop(x, y) {
    return (x > (this.x - 10) && x < (this.x + this.width + 10)
    && y > (this.y - 10) && y < (this.y + this.height + 10));
  }

  moveConnection(dest) {
    for (let i = 0; i < 2; i ++) {
      const arrow = this.arrows[i];
      if (arrow && arrow.conn && arrow.conn.toView === dest) {
        this.canvas.connection(arrow.conn);
      }
    }
  }

  jsonify() {
    const json = {
      x: this.x,
      y: this.y,
      type: this.type,
      name: this.name,
      out: [null, null]};


    for (let i = 0; i < 2; i ++) {
      const arrow = this.arrows[i];
      if (arrow.conn) json.out[i] = arrow.conn.toView.name;
    }

    if (this.model) {
      json.model = this.model.jsonify();
    }

    return json;
  }
}
