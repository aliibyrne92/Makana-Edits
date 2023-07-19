const base = module.superModule;
const copay = require('*/cartridge/models/product/decorators/copay');
const dosage = require('*/cartridge/models/product/decorators/dosage');

/**
 * Decorate product with product tile information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} productType - Product type information
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function productTile(product, apiProduct, productType) {
    base.call(this, product, apiProduct, productType);

    copay(product, apiProduct);
    dosage(product, apiProduct);

    return product;
};
