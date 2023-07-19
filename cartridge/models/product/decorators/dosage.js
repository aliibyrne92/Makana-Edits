module.exports = function (product, apiProduct) {
    Object.defineProperty(product, 'dosage', {
        enumerable: true,
        value: apiProduct.custom.Dosage || null
    });
};
