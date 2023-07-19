module.exports = function (product, apiProduct) {
    Object.defineProperty(product, 'mhCopay', {
        enumerable: true,
        value: apiProduct.custom.mhCopay || false
    });
};
