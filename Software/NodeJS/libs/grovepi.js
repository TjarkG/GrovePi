// Modules
const i2c = require('i2c-bus');
const async = require('async');
const fs = require('fs');
const commands = require('./commands');

const debugMode = false;
const i2c0Path = '/dev/i2c-0';
const i2c1Path = '/dev/i2c-1';
let bus;
let busNumber;

const initWait = 1;     // in seconds

let isInit = false;
let isHalt = false;

const ADDRESS = 0x04;

let onError, onInit;

function GrovePi(opts) {
    this.BYTESLEN = 4
    this.INPUT = 'input'
    this.OUTPUT = 'output'

    if (typeof opts == 'undefined')
        opts = {}

    if (typeof opts.debug != 'undefined')
        this.debugMode = opts.debug
    else
        this.debugMode = debugMode

    // TODO: Dispatch an error event instead
    if (typeof opts.onError == 'function')
        onError = opts.onError

    // TODO: Dispatch a init event instead
    if (typeof opts.onInit == 'function')
        onInit = opts.onInit

    if (fs.existsSync(i2c0Path)) {
        isHalt = false
        busNumber = 0
    } else if (fs.existsSync(i2c1Path)) {
        isHalt = false
        busNumber = 1
    } else {
        const err = new Error('GrovePI could not determine your i2c device');
        isHalt = true
        if (typeof onError == 'function')
            onError(err)
        this.debug(err)
    }
}

GrovePi.prototype.init = function () {
    if (!isHalt) {
        bus = i2c.openSync(busNumber)

        if (!isInit) {
            this.debug('GrovePi is initing')
            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, initWait * 1000)
            isInit = true

            if (typeof onInit == 'function')
                onInit(true)
        } else {
            const err = new Error('GrovePI is already initialized');
            if (typeof onInit == 'function')
                onInit(false)
            onError(err)
        }
    } else {
        const err2 = new Error('GrovePI cannot be initialized');
        if (typeof onInit == 'function')
            onInit(false)
        onError(err2)
    }
}
GrovePi.prototype.close = function () {
    if (typeof bus != 'undefined') {
        this.debug('GrovePi is closing')
        bus.closeSync()
    } else {
        this.debug('The device is not defined')
    }
}
GrovePi.prototype.run = function (tasks) {
    this.debug('GrovePi is about to execute ' + tasks.length + ' tasks')
    async.waterfall(tasks)
}
GrovePi.prototype.checkStatus = function () {
    if (!isInit || isHalt) {
        if (!isHalt) {
            this.debug('GrovePi needs to be initialized.')
        } else {
            this.debug('GrovePi is not operative because halted')
        }
        return false
    }
    return true
}
GrovePi.prototype.readByte = function () {
    const isOperative = this.checkStatus();
    if (!isOperative)
        return false

    const length = 1;
    const buffer = new Buffer.alloc(length);
    const ret = bus.i2cReadSync(ADDRESS, length, buffer);
    return ret > 0 ? buffer : false
}
GrovePi.prototype.readBytes = function (length) {
    if (typeof length == 'undefined')
        length = this.BYTESLEN

    const isOperative = this.checkStatus();
    if (!isOperative)
        return false

    const buffer = new Buffer.alloc(length);
    let ret = false;
    try {
        const val = bus.i2cReadSync(ADDRESS, length, buffer);
        ret = val > 0 ? buffer : false
    } catch (err) {
        ret = false
    } finally {
        return ret
    }
}
GrovePi.prototype.writeBytes = function (bytes) {
    const isOperative = this.checkStatus();
    if (!isOperative)
        return false

    const buffer = new Buffer.from(bytes);
    let ret = false;
    try {
        const val = bus.i2cWriteSync(ADDRESS, buffer.length, buffer);
        ret = val > 0
    } catch (err) {
        ret = false
    } finally {
        return ret
    }
}
GrovePi.prototype.pinMode = function (pin, mode) {
    const isOperative = this.checkStatus();
    if (!isOperative)
        return false

    if (mode === this.OUTPUT) {
        return this.writeBytes(commands.pMode.concat([pin, 1, commands.unused]))
    } else if (mode === this.INPUT) {
        return this.writeBytes(commands.pMode.concat([pin, 0, commands.unused]))
    } else {
        this.debug('Unknown pin mode')
    }
}
GrovePi.prototype.debug = function (msg) {
    if (this.debugMode)
        console.log('GrovePi.board', msg);
}

// Sleep milliseconds
GrovePi.prototype.wait = function (ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

// GrovePi functions
GrovePi.prototype.version = function () {
    const write = this.writeBytes(commands.version.concat([commands.unused, commands.unused, commands.unused]));
    if (write) {
        this.wait(100)
        this.readByte()
        const bytes = this.readBytes();
        if (typeof bytes == 'object')
            return (bytes[1] + '.' + bytes[2] + '.' + bytes[3])
        else
            return false
    } else {
        return false
    }
}

// export the class
module.exports = GrovePi
