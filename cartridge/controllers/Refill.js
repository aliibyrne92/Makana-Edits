// @ts-nocheck
'use strict';

var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

server.get('List', function (req, res, next) {
    var Locale = require('dw/util/Locale');

    var OrderModel = require('*/cartridge/models/order');
    var RefillHelpers = require('*/cartridge/scripts/refill/refillHelpers');

    var ordersResult = RefillHelpers.getRefills(req.currentCustomer, req.querystring, req.locale.id);
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

    res.render('account/refill/history', {
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
        var exitLinkText = Resource.msg('link.orderdetails.orderhistory', 'account', null);
        var exitLinkUrl = URLUtils.https('Refill-List', 'orderFilter', req.querystring.orderFilter);
        res.render('account/refill/refillDetails', {
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
