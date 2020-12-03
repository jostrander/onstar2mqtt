const assert = require('assert');
const _ = require('lodash');

const { Diagnostic } = require('../src/diagnostic');
const MQTT = require('../src/mqtt');
const apiResponse = require('./diagnostic.sample.json');

describe('MQTT', () => {
    let mqtt;
    beforeEach(() => mqtt = new MQTT());

    it('should set defaults', () => {
        assert.strictEqual(mqtt.prefix, 'homeassistant');
        assert.strictEqual(mqtt.instance, 'XXX');
    });

    it('should convert names for mqtt topics', () => {
        assert.strictEqual(MQTT.convertName('foo bar'), 'foo_bar');
        assert.strictEqual(MQTT.convertName('foo bar bazz'), 'foo_bar_bazz');
        assert.strictEqual(MQTT.convertName('FOO BAR'), 'foo_bar');
        assert.strictEqual(MQTT.convertName('FOO BAR bazz'), 'foo_bar_bazz');
    });

    it('should convert names to be human readable', () => {
        assert.strictEqual(MQTT.convertFriendlyName('foo bar'), 'Foo Bar');
        assert.strictEqual(MQTT.convertFriendlyName('FOO BAR'), 'Foo Bar');
    });

    describe('topics', () => {
        let d;
        describe('sensor', () => {
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[0]')));

            it('should generate config topics', () => {
                assert.strictEqual(mqtt.getConfigTopic(d), 'homeassistant/sensor/XXX/ambient_air_temperature/config');
            });
            it('should generate state topics', () => {
                assert.strictEqual(mqtt.getStateTopic(d, d.diagnosticElements[0]), 'homeassistant/sensor/XXX/ambient_air_temperature/state');
            });
        });

        describe('binary_sensor', () => {
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[3]')));
            it('should generate config topics', () => {
                assert.strictEqual(mqtt.getConfigTopic(d), 'homeassistant/binary_sensor/XXX/ev_charge_state/config');
            });
            it('should generate state topics', () => {
                assert.strictEqual(mqtt.getStateTopic(d.diagnosticElements[1]), 'homeassistant/binary_sensor/XXX/priority_charge_indicator/state');
            });
        });
    });

    describe('payloads', () => {
        let d;
        describe('sensor', () => {
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[0]')));
            it('should generate config payloads', () => {
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[0]), {
                    device_class: 'temperature',
                    json_attributes_template: undefined,
                    name: 'Ambient Air Temperature',
                    state_topic: 'homeassistant/sensor/XXX/ambient_air_temperature/state',
                    unit_of_measurement: '°C',
                    value_template: '{{ value_json.ambient_air_temperature }}'
                });
            });
            it('should generate state payloads', () => {
                assert.deepStrictEqual(mqtt.getStatePayload(d), {
                    ambient_air_temperature: 15
                });
            });
        });

        describe('binary_sensor', () => { // TODO maybe not needed, payloads not diff
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[3]')));
            it('should generate config payloads', () => {
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[1]), {
                  device_class: undefined,
                  json_attributes_template: undefined,
                  name: 'Priority Charge Indicator',
                  state_topic: 'homeassistant/binary_sensor/XXX/ev_charge_state/state',
                  unit_of_measurement: undefined,
                  value_template: '{{ value_json.priority_charge_indicator }}'
                });
            });
            it('should generate state payloads', () => {
                assert.deepStrictEqual(mqtt.getStatePayload(d), {
                  ev_charge_state: false,
                  priority_charge_indicator: false,
                  priority_charge_status: false
                });
            });
        });

        describe('attributes', () => {
            beforeEach(() => d = new Diagnostic(_.get(apiResponse, 'commandResponse.body.diagnosticResponse[8]')));
            it('should generate payloads with an attribute', () => {
                assert.deepStrictEqual(mqtt.getConfigPayload(d, d.diagnosticElements[0]), {
                    device_class: 'pressure',
                    json_attributes_template: '{{ {"recommendation": value_json.tire_pressure_placard_front} | tojson }}',
                    name: 'Tire Pressure: Left Front',
                    state_topic: 'homeassistant/sensor/XXX/tire_pressure/state',
                    unit_of_measurement: 'kPa',
                    value_template: '{{ value_json.tire_pressure_lf }}'
                });
            });
        });
    });
});
