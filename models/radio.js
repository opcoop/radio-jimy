var mongoose = require('mongoose')
,     Schema = mongoose.Schema
;
var Radio = new mongoose.Schema({
        name:    { type: String, required: true, unique: true},
        desc:    { type: String, required: true},
        creator: { type: String, required: true},
        position: {
                lng: {type: Number, required: true, min: -100, max: 100},
                lat: {type: Number, required: true, min: -100, max: 100}
        },
        stream: {type: String,  default: null},
        onair:  {type: Boolean, default: false},
        onnet:  {type: Boolean, default: false},
        img:    String,
        prov:   String,
        city:   String,
        freq:   String,
        cover:  String
});

module.exports = Radio;
