const util = require('util');
const EventEmitter = require('events').EventEmitter;
const Board = require('../../grovepi');

const isEqual = function (a, b) {
    if (typeof a == 'object') {
        for (let i in a) {
            if (a[i] !== b[i]) {
                return false
            }
        }
        return true
    } else {
        return a === b
    }
};

function Sensor() {
    this.board = new Board()
    this.lastValue = 0
    this.currentValue = 0
    this.streamInterval = this.watchInterval = undefined
    this.watchDelay = 100
}

util.inherits(Sensor, EventEmitter)

Sensor.prototype.read = function () {
}
Sensor.prototype.write = function () {
}
Sensor.prototype.stream = function (delay, cb) {
    const self = this;
    delay = typeof delay == 'undefined' ? self.watchDelay : delay

    self.stopStream()
    self.streamInterval = setInterval(function onStreamInterval() {
        const res = self.read();
        cb(res)
    }, delay)
}
Sensor.prototype.stopStream = function () {
    const self = this;
    if (typeof self.streamInterval != 'undefined')
        clearInterval(self.streamInterval)
}

Sensor.prototype.watch = function (delay) {
    const self = this;
    delay = typeof delay == 'undefined' ? self.watchDelay : delay

    self.stopWatch()
    self.watchInterval = setInterval(function onInterval() {
        const res = self.read();

        self.lastValue = self.currentValue
        self.currentValue = res

        if (!isEqual(self.currentValue, self.lastValue))
            self.emit('change', self.currentValue)
    }, delay)
}
Sensor.prototype.stopWatch = function () {
    const self = this;
    if (typeof self.watchInterval != 'undefined')
        clearInterval(self.watchInterval)
}

module.exports = Sensor
