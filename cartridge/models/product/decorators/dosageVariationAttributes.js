'use strict';

var ATTRIBUTE_NAME2 = 'Dosage';
var collections = require('*/cartridge/scripts/util/collections');
var URLUtils = require('dw/web/URLUtils');

module.exports = function (object, hit) {
    Object.defineProperty(object, 'dosageVariationAttributes', {
        enumerable: true,
        value: (function () {
            var dosages = hit.getRepresentedVariationValues(ATTRIBUTE_NAME2);

            var dummy = [{
                attributeId: 'dosage',
                id: 'dosage',
                // swatchable: true,
                values: collections.map(dosages, function (dosage) {
                    // var apiImage = dosage.getImage('swatch', 0);
                    // if (!apiImage) {
                    //     return {};
                    // }
                    return {
                        id: dosage.ID,
                        description: dosage.description,
                        displayValue: dosage.displayValue,
                        value: dosage.value,
                        selectable: true,
                        selected: true,
                        // images: {
                        //     swatch: [{
                        //         alt: apiImage.alt,
                        //         url: apiImage.URL.toString(),
                        //         title: apiImage.title
                        //     }]
                        // },
                        url: URLUtils.url(
                            'Product-Show',
                            'pid',
                            hit.productID,
                            'dwvar_' + hit.productID + '_dosage',
                            dosage.value
                        ).toString()
                    };
                })
            }];

            
            return dummy;
        }())
    });
};
