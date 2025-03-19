const FormGroup = require('../models/customer/clientAttributes/FormGroup');   // Adjust path as per your project
const FormField = require('../models/customer/clientAttributes/FormField');   // Adjust path as per your project
const FormFieldValue = require('../models/customer/clientAttributes/FromFieldValue');

async function getGroupedAttributes(payloadData) {
    const groups = await FormGroup.aggregate([
        {
            $lookup: {
                from: 'formfields', // This should match your actual collection name in MongoDB
                localField: '_id',
                foreignField: 'groupId',
                as: 'attributes'
            }
        },
        {
            $project: {
                _id: 0,
                groupName: '$name',
                attributes: {
                    $map: {
                        input: '$attributes',
                        as: 'attr',
                        in: {
                            attributeId: { $toString: '$$attr._id' },
                            attributeName: '$$attr.name',
                            attributeType: '$$attr.type',
                            attributeState: '$$attr.state'
                        }
                    }
                }
            }
        }
    ]);

    // Format response the way you want (structured text-like response)
    // const formattedOutput = groups.map(group => {
    //     let output = `Group Name: ${group.groupName}\n`;
    //     group.attributes.forEach(attr => {
    //         output += `  Attribute ID: ${attr.attributeId}\n`;
    //         output += `  Attribute Name: ${attr.attributeName}\n`;
    //         output += `  Attribute Type: ${attr.attributeType}\n`;
    //         output += `  Attribute State: ${attr.attributeState}\n`;
    //     });
    //     output += '-----------------------\n';
    //     return output;
    // }).join('');

    return [payloadData, groups];
}

async function saveUserData(userId, data, group) {
    const groups = Object.keys(data); // ["personalDetails", "basicInformation", ...]

    for (const groupName of groups) {
        const groupData = data[groupName];
        
        // const group = await FormGroup.findOne({ name: groupName });
        
        if (!group) {
            console.log(`Group ${groupName} not found in DB. Skipping.`);
            continue;
        }

        // console.log("group.field::::", group)

        for (const [fieldName, fieldValue] of Object.entries(groupData)) {
            // console.log("groupdata:::::", group)
            const field = group.fields.find(f => f.attributeName === fieldName);

            console.log("field:::::::::::::::::::::::", field)

            if (!field) {
                console.log(`Field ${fieldName} not found in group ${groupName}. Skipping.`);
                continue;
            }

            console.log("final result::::", {
                groupId: group._id,
                fieldId: field.attributeId,
                customeId: userId,
                value: fieldValue
            })

            const fieldValueDoc = new FormFieldValue({
                groupId: group._id,
                fieldId: field.attributeId,
                customeId: userId,
                value: fieldValue
            });

            await fieldValueDoc.save();
        }
    }

    console.log("User data saved successfully!");
}


module.exports = { getGroupedAttributes , saveUserData};
