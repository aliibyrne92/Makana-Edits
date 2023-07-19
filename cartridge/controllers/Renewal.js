// @ts-nocheck
'use strict';

var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

server.get('List', function (req, res, next) {
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

    res.render('account/renewal/history', {
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
    var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');
    const Transaction = require("dw/system/Transaction");

    var order = OrderMgr.getOrder(req.querystring.orderID);
    var orderCustomerNo = req.currentCustomer.profile.customerNo;
    var currentCustomerNo = order.customer.profile.customerNo;
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
            htmlValue: Resource.msg('label.orderhistory', 'account', null),
            url: URLUtils.url('Order-History').toString()
        }
    ];

    if (order && orderCustomerNo === currentCustomerNo) {
        var orderModel = orderHelpers.getOrderDetails(req);
        var exitLinkText = 'Back to Prescriptions';
        var exitLinkUrl = URLUtils.https('Prescription-Show');

        Transaction.wrap(function () {
            order.custom.mhRenewable = false;
        });

        res.render('account/renewal/renewalDetails', {
            order: orderModel,
            exitLinkText: exitLinkText,
            exitLinkUrl: exitLinkUrl,
            breadcrumbs: breadcrumbs
        });
    } else {
        res.redirect(URLUtils.url('Account-Show'));
    }
    next();
});

module.exports = server.exports();
