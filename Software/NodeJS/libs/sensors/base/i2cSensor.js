const util = require('util');
const Sensor = require('./sensor');
const commands = require('../../commands');

function I2cSensor() {
    Sensor.apply(this, Array.prototype.slice.call(arguments))
}

util.inherits(I2cSensor, Sensor)
I2cSensor.prototype = new I2cSensor()

module.exports = I2cSensor