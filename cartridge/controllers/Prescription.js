// @ts-nocheck
'use strict';

var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

server.get('Show', function (req, res, next) {
    var Locale = require('dw/util/Locale');

    var OrderModel = require('*/cartridge/models/order');
    var RefillHelpers = require('*/cartridge/scripts/refill/refillHelpers');
    var RenewalHelpers = require('*/cartridge/scripts/renewal/renewalHelpers');
    const CustomObjectMgr = require("dw/object/CustomObjectMgr");

    // Renewals
    var renewalOrdersResult = RenewalHelpers.getRenewals(req.currentCustomer, req.querystring, req.locale.id);
    var renewalOrders = renewalOrdersResult.orders;

    for (let i = 0; i < renewalOrders.length; i++) {
        let mappedOrder = renewalOrders[i];
        let rawOrder = OrderMgr.getOrder(mappedOrder.orderNumber);

        let options = {
            config: {
                numberOfLineItems: '*'
            },
            countryCode: Locale.getLocale(req.locale.id).country,
            containerView: 'order'
        }

        let orderModel = new OrderModel(rawOrder, options);
        mappedOrder.orderModel = orderModel;
    }

    // Refills
    var refillOrdersResult = RefillHelpers.getRefills(req.currentCustomer, req.querystring, req.locale.id);
    var refillOrders = refillOrdersResult.orders;

    for (let i = 0; i < refillOrders.length; i++) {
        let mappedOrder = refillOrders[i];
        let rawOrder = OrderMgr.getOrder(mappedOrder.orderNumber);

        let options = {
            config: {
                numberOfLineItems: '*'
            },
            countryCode: Locale.getLocale(req.locale.id).country,
            containerView: 'order'
        }

        let orderModel = new OrderModel(rawOrder, options);
        mappedOrder.orderModel = orderModel;
    }

    var filterValues = renewalOrdersResult.filterValues;

    var breadcrumbs = [
        {
            htmlValue: Resource.msg('global.home', 'common', null),
            url: URLUtils.home().toString()
        },
        {
            htmlValue: Resource.msg('page.title.myaccount', 'account', null),
            url: URLUtils.url('Account-Show').toString()
        }
    ];

    //
    // Greg TODO (A): Refactor this to private function to segregate prescribers functionality
    //
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

    //
    // Address form (to populate list of US States)
    //
    let addressForm = server.forms.getForm("address");
    addressForm.clear();


    res.render('account/prescription/prescriptionMain', {
        addressForm: addressForm,
        currentPrescribers: currentPrescribers,
        refillOrders: refillOrders,
        renewalOrders: renewalOrders,
        filterValues: filterValues,
        orderFilter: req.querystring.orderFilter,
        accountlanding: false,
        breadcrumbs: breadcrumbs,
        addToCartUrl: URLUtils.url('Cart-AddProduct')
    });

    next();
});

server.get('NewPrescription', function (req, res, next) {
    var Locale = require('dw/util/Locale');

    var OrderModel = require('*/cartridge/models/order');
    var RenewalHelpers = require('*/cartridge/scripts/renewal/renewalHelpers');

    var ordersResult = RenewalHelpers.getRenewals(req.currentCustomer, req.querystring, req.locale.id);
    var orders = ordersResult.orders;
    var filterValues = ordersResult.filterValues;

    var breadcrumbs = [
        {
            htmlValue: Resource.msg('global.home', 'common', null),
            url: URLUtils.home().toString()
        },
        {
            htmlValue: Resource.msg('page.title.myaccount', 'account', null),
            url: URLUtils.url('Account-Show').toString()
        }
    ];

    for (let i = 0; i < orders.length; i++) {
        let mappedOrder = orders[i];
        let rawOrder = OrderMgr.getOrder(mappedOrder.orderNumber);

        let options = {
            config: {
                numberOfLineItems: '*'
            },
            countryCode: Locale.getLocale(req.locale.id).country,
            containerView: 'order'
        }

        let orderModel = new OrderModel(rawOrder, options);
        mappedOrder.orderModel = orderModel;
    }

    res.render('account/prescription/newPrescription', {
        orders: orders,
        filterValues: filterValues,
        orderFilter: req.querystring.orderFilter,
        accountlanding: false,
        breadcrumbs: breadcrumbs,
        addToCartUrl: URLUtils.url('Cart-AddProduct')
    });

    next();
});

server.get('Details', function (req, res, next) {

    var breadcrumbs = [
        {
            htmlValue: Resource.msg('global.home', 'common', null),
            url: URLUtils.home().toString()
        },
        {
            htmlValue: Resource.msg('page.title.myaccount', 'account', null),
            url: URLUtils.url('Account-Show').toString()
        },
        {
            htmlValue: 'Greg to research',
            url: URLUtils.url('Order-History').toString()
        }
    ];

    var exitLinkText = 'Back to Prescriptions';
    var exitLinkUrl = URLUtils.https('Prescription-Show', 'orderFilter', req.querystring.orderFilter);

    res.render('account/prescription/prescriptionDetails', {
        exitLinkText: exitLinkText,
        exitLinkUrl: exitLinkUrl,
        breadcrumbs: breadcrumbs
    });

    next();
});

module.exports = server.exports();
