const mongoose = require('mongoose');

const formFieldsValueSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FormGroup",
        required: true,
    },
    fieldId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FormField",
        required: true
    },
    value: {
        type: String,
        required: true
    },
    customeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
}, { timestamps: true });

const FormFieldsValue = mongoose.model('FormFieldsValue', formFieldsValueSchema);

module.exports = FormFieldsValue;
