const { validationResult } = require("express-validator");
const FormGroup = require("../../models/customer/FormGroup")
const FormField = require("../../models/customer/FormField")

exports.form_group = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    const existingGroup = await FormGroup.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ error: "A form group with this name already exists" });
    }
    
    const formGroup = new FormGroup({ name });
    await formGroup.save();
    res.status(201).json(formGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.form_field = async (req, res) => {
try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { attributeName, attributeType, attributeState, attributePlaceHolder, attributeEnum, attributeOption, form_group_id } = req.body;

    const formGroup = await FormGroup.findById(form_group_id);
    if (!formGroup) {
      return res.status(404).json({ error: "Form Group not found" });
    }

    const existingField = await FormField.findOne({ form_group_id, attributeName });
    if (existingField) {
      return res.status(400).json({ error: "A field with this attributeName already exists in the form group" });
    }

    const formField = new FormField({
    attributeName,
    attributeType,
    attributeState,
    attributePlaceHolder,
    attributeEnum,
    attributeOption,
    form_group_id,
    });

    await formField.save();

    // Add the form field to the form group
//   formGroup.formFields.push(formField._id);
//   await formGroup.save();

    res.status(201).json(formField);
} catch (error) {
    res.status(500).json({ error: error.message });
}
}

  exports.form_group_List = async (req, res) => {
    try {
      const formGroups = await FormGroup.aggregate([
        // {
        //     $match: { _id: new mongoose.Types.ObjectId(groupId) } 
        // },
        {
            $lookup: {
                from: "formfields",   // The collection name in MongoDB (lowercase + plural by default)
                localField: "_id",
                foreignField: "form_group_id",
                as: "formFields"
            }
        }
    ]);
      res.status(200).json(formGroups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }