"use strict";

import joint from 'jointjs';
import bigInt from 'big-integer';
import * as help from '@app/help.js';
import { Vector3vl } from '3vl';

// Multiplexers
joint.shapes.digital.Gate.define('digital.GenMux', {
    attrs: {
        "rect.wtf": {
            y: -4, width: 40, height: 1, visibility: 'hidden'
        },
        "text.arrow": {
            text: '✔', 'y-alignment': 'middle', fill: 'black',
            visibility: 'hidden'
        }
    }
}, {
    constructor: function(args) {
        if (!args.bits) args.bits = { in: 1, sel: 1 };
        const n_ins = this.muxNumInputs(args.bits.sel);
        const size = { width: 40, height: n_ins*16+8 };
        _.set(args, ['attrs', '.body', 'points'], 
            [[0,0],[40,10],[40,size.height-10],[0,size.height]]
                .map(x => x.join(',')).join(' '));
        args.size = size;
        const markup = [];
        for (const num of Array(n_ins).keys()) {
            const y = num*16+12;
            markup.push(this.addWire(args, 'left', y, { id: 'in' + num, dir: 'in', bits: args.bits.in }));
        }
        markup.push(this.addWire(args, 'top', 0.5, { id: 'sel', dir: 'in', bits: args.bits.sel }));
        markup.push(this.addWire(args, 'right', (size.height)/2, { id: 'out', dir: 'out', bits: args.bits.in }));
        markup.push('<polygon class="body"/><rect class="wtf"/><text class="label"/>');
        for (const num of Array(n_ins).keys()) {
            const y = num*16+12;
            markup.push('<text class="arrow arrow_in' + num + '" />');
            args.attrs['text.arrow_in' + num] = {
                'ref-x': 2,
                'ref-y': y,
            };
        }
        this.markup = markup.join('');
        joint.shapes.digital.Gate.prototype.constructor.apply(this, arguments);
    },
    operation: function(data) {
        const i = this.muxInput(data.sel);
        if (i === undefined) return { out: Vector3vl.xes(this.get('bits').in) };
        return { out: data['in' + i] };
    },
    gateParams: joint.shapes.digital.Gate.prototype.gateParams.concat(['bits'])
});
joint.shapes.digital.GenMuxView = joint.shapes.digital.GateView.extend({
    initialize: function() {
        this.n_ins = this.model.muxNumInputs(this.model.get('bits').sel);
        this.listenTo(this.model, 'change:inputSignals', (_, data) => this.updateMux(data));
        joint.shapes.digital.GateView.prototype.initialize.apply(this, arguments);
    },
    render: function() {
        joint.shapes.digital.GateView.prototype.render.apply(this, arguments);
        this.updateMux(this.model.get('inputSignals'));
    },
    updateMux: function(data) {
        const i = this.model.muxInput(data.sel);
        for (const num of Array(this.n_ins).keys()) {
            this.$('text.arrow_in' + num).css('visibility', i == num ? 'visible' : 'hidden');
        }
    }
});

// Multiplexer with binary selection
joint.shapes.digital.GenMux.define('digital.Mux', {
}, {
    muxNumInputs: n => 1 << n,
    muxInput: i => i.isFullyDefined ? help.sig2bigint(i).toString() : undefined
});
joint.shapes.digital.MuxView = joint.shapes.digital.GenMuxView;

// Multiplexer with one-hot selection
joint.shapes.digital.GenMux.define('digital.Mux1Hot', {
}, {
    muxNumInputs: n => n + 1,
    muxInput: s => {
        const i = s.toArray();
        return s.isFullyDefined && i.filter(x => x == 1).length <= 1
            ? String(i.indexOf(1)+1) : undefined
    }
});
joint.shapes.digital.Mux1HotView = joint.shapes.digital.GenMuxView;

