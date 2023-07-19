// @ts-nocheck
"use strict";

const server = require("server");
const CustomObjectMgr = require("dw/object/CustomObjectMgr");
const Transaction = require("dw/system/Transaction");

const addPrescriberToCustomer = (currentCustomer, newPrescriberId) => {
    const prescriberCO = CustomObjectMgr.getCustomObject("mhPrescriber", newPrescriberId);

    if (prescriberCO && currentCustomer.raw.profile) {
        const existingPrescriberIds = currentCustomer.raw.profile.custom.mhPrescribers;

        // Add the Prescriber ID to customer's Prescriber list (if it doesn't already exist)
        if (existingPrescriberIds.indexOf(newPrescriberId) == -1) {
            let updatedPrescriberIds = [];

            for (let i = 0; i < existingPrescriberIds.length; i++) {
                updatedPrescriberIds.push(existingPrescriberIds[i]);
            }

            updatedPrescriberIds.push(newPrescriberId);

            Transaction.wrap(function () {
                currentCustomer.raw.profile.custom.mhPrescribers = updatedPrescriberIds;
            });
        }
    }

    return prescriberCO;
}

const createNewPrescriberCO = (form) => {
    // Generate random key for this new Prescriber
    const min = Math.ceil(100000);
    const max = Math.floor(999999);
    const newPrescriberId = (Math.floor(Math.random() * (max - min)) + min).toString();

    // Create the new Prescriber custom object
    Transaction.begin();
    const newPrescriberCO = CustomObjectMgr.createCustomObject("mhPrescriber", newPrescriberId);
    newPrescriberCO.custom.name = form.newPrescriberName;
    newPrescriberCO.custom.addressLine1 = form.newPrescriberAddress;
    newPrescriberCO.custom.city = form.newPrescriberCity;
    newPrescriberCO.custom.state = form.newPrescriberState;
    newPrescriberCO.custom.zip = form.prescriberZip;
    newPrescriberCO.custom.phone = form.newPrescriberPhone;
    newPrescriberCO.custom.fax = form.newPrescriberFax;
    Transaction.commit();

    return newPrescriberCO;
};

server.get("List", server.middleware.https, function (req, res, next) {
    let currentPrescribers = [];

    // Get the list of Prescriber ID's from customer profile
    const prescriberIds = req.currentCustomer.raw.profile.custom.mhPrescribers;

    // Get the actual Prescriber custom objects and populate the array
    for (let i = 0; i < prescriberIds.length; i++) {
        let prescriberCO = CustomObjectMgr.getCustomObject("mhPrescriber", prescriberIds[i]);

        if (prescriberCO) {
            let props = prescriberCO.custom;

            let newOption = {
                id: props.ID || "",
                npi: props.npi || "",
                name: props.name || props.firstName.concat(" ", props.lastName),
                firstName: props.firstName || "",
                lastName: props.lastName || "",
                phone: props.phone || "",
                fax: props.fax || "",
                addressLine1: props.addressLine1 || "",
                city: props.city || "",
                state: props.state || "",
                zip: props.zip || "",
            };

            currentPrescribers.push(newOption);
        }
    }

    res.setViewData({
        currentPrescribers: currentPrescribers
    });

    res.render("prescriber/listPrescribers");

    next();
});

server.get("Add", server.middleware.https, function (req, res, next) {
    let addressForm = server.forms.getForm("address");
    addressForm.clear();

    res.setViewData({
        addressForm: addressForm,
        customerId: req.currentCustomer.raw.profile ? req.currentCustomer.raw.profile.customerNo : null
    });

    res.render("prescriber/addPrescriber");
    next();
});

server.post("AddExisting", server.middleware.https, function (req, res, next) {
    let body = JSON.parse(req.body);

    let prescriberCO = addPrescriberToCustomer(req.currentCustomer, body.prescriberId);

    let responseObject = {
        prescriberId: prescriberCO.custom.ID || "",
        prescriberName: prescriberCO.custom.name || "",
        prescriberPhone: prescriberCO.custom.phone || "",
        prescriberFax: prescriberCO.custom.fax || "",
    };

    res.json(responseObject);
    next();
});

server.post("AddNew", server.middleware.https, function (req, res, next) {
    const URLUtils = require("dw/web/URLUtils");
    let form = JSON.parse(req.body);

    // Create the new Prescriber custom object
    let newPrescriberCO = createNewPrescriberCO(form);

    // Associate the new Prescriber custom object with the current customer
    addPrescriberToCustomer(req.currentCustomer, newPrescriberCO.custom.ID);

    let responseObject = {
        prescriberId: newPrescriberCO.custom.ID || "",
        prescriberName: newPrescriberCO.custom.name || "",
        prescriberPhone: newPrescriberCO.custom.phone || "",
        prescriberFax: newPrescriberCO.custom.fax || "",
    };

    res.json({
        success: true,
        responseObject: responseObject,
        redirectUrl: URLUtils.url('Prescription-Show').toString()
    });

    next();
});

server.post("Search", server.middleware.https, function (req, res, next) {
    const body = JSON.parse(req.body);

    let prescriberCandidate;
    let prescribersList = [];
    let queryResults;

    let existingPrescriberIds = req.currentCustomer.raw.profile.custom.mhPrescribers;

    if (body.searchPrescriberState) {
        queryResults = CustomObjectMgr.queryCustomObjects(
            "mhPrescriber",
            "custom.state = {0}",
            null,
            body.searchPrescriberState
        );
    }

    while (queryResults.hasNext()) {
        prescriberCandidate = queryResults.next();

        // Exclude prescribers that don't meet Name criteria
        if (body.searchPrescriberName) {
            if (!prescriberCandidate.custom.name.toLowerCase().includes(body.searchPrescriberName.toLowerCase())) {
                continue;
            }
        }

        // Exclude doctors that don't meet City criteria
        if (body.searchPrescriberCity) {
            if (prescriberCandidate.custom.city.toLowerCase() != body.searchPrescriberCity.toLowerCase()) {
                continue;
            }
        }

        // Exclude doctors that don't meet Zip criteria
        if (body.searchPrescriberZip) {
            if (prescriberCandidate.custom.zip != body.searchPrescriberZip) {
                continue;
            }
        }

        // Exclude prescribers already linked to customer
        if (existingPrescriberIds.includes(prescriberCandidate.custom.ID)) {
            continue;
        }

        // All tests passed ... add this Prescriber to the list
        prescribersList.push({
            addressLine1: prescriberCandidate.custom.addressLine1,
            city: prescriberCandidate.custom.city,
            id: prescriberCandidate.custom.ID,
            name: prescriberCandidate.custom.name,
            phone: prescriberCandidate.custom.phone,
            state: prescriberCandidate.custom.state,
            zip: prescriberCandidate.custom.zip,
        });
    }

    const responseObject = {
        prescribersList: prescribersList,
    };

    res.json(responseObject);
    next();
});

server.post("Remove", server.middleware.https, function (req, res, next) {
    const body = JSON.parse(req.body);

    if (req.currentCustomer.raw.profile) {
        const existingPrescriberIds = req.currentCustomer.raw.profile.custom.mhPrescribers;
        const updatedPrescriberIds = existingPrescriberIds.filter((id) => id != body.prescriberId);

        Transaction.wrap(function () {
            req.currentCustomer.raw.profile.custom.mhPrescribers = updatedPrescriberIds;
        });
    }

    res.json({});
    next();
});

module.exports = server.exports();
