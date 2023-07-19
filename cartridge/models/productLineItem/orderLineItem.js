const base = module.superModule;

/**
 * Decorate product with product line item information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @returns {Object} - Decorated product model
 */
module.exports = function orderLineItem(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);

    product.mhRefillsMax = 7;
    product.mhRefillsRemaining = 3;

    return product;
};
