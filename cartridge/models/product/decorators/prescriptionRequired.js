module.exports = function (product, apiProduct) {
    Object.defineProperty(product, 'mhPrescriptionRequired', {
        enumerable: true,
        value: apiProduct.custom.mhPrescriptionRequired || null
    });
};
