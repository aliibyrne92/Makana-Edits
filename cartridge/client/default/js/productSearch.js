'use strict';

var debounce = require('lodash/debounce');
var endpoint = $('.product-suggestions-wrapper').data('url');
var minChars = 4;

/**
 * Retrieves Suggestions element relative to scope
 *
 * @param {Object} scope - Search input field DOM element
 * @return {JQuery} - .product-suggestions-wrapper element
 */
function getSuggestionsWrapper(scope) {
    return $(scope)
        .parent()
        .parent()
        .children('.product-suggestions-wrapper');
}

/**
 * Tear down Suggestions panel
 */
function tearDownSuggestions(productName) {
    $('input.product-search-field').val(productName || '');
    $('.search-mobile .suggestions').unbind('scroll');
    $('.product-suggestions-wrapper').empty();
    $('body').removeClass('site-search-active');
}

/**
 * Toggle search field icon from search to close and vice-versa
 *
 * @param {string} action - Action to toggle to
 */
function toggleSuggestionsIcon(action) {
    var mobileSearchIcon = '.search-mobile span.';
    var iconSearch = 'fa-search';
    var iconSearchClose = 'fa-close';

    if (action === 'close') {
        $(mobileSearchIcon + iconSearch)
            .removeClass(iconSearch)
            .addClass(iconSearchClose);
    } else {
        $(mobileSearchIcon + iconSearchClose)
            .removeClass(iconSearchClose)
            .addClass(iconSearch);
    }
}

/**
 * Process Ajax response for SearchServices-GetSuggestions
 *
 * @param {Object|string} response - Empty object literal if null response or string with rendered
 *                                   suggestions template contents
 */
function processResponse(response) {
    var $suggestionsWrapper = getSuggestionsWrapper(this).empty();

    $.spinner().stop();

    if (!(typeof response === 'object')) {
        $suggestionsWrapper.append(response).show();

        $('.suggested-product-name').on('click', function (e) {
            console.log(e.target);
            // Find e.target dosages
            // may need to jquery to find dosages -- hidden element on client
            $('body').trigger('product:suggestion-selected', e.target.innerText);
        });    

        $('body').addClass('site-search-active');
    } else {
        $suggestionsWrapper.hide();
        $('body').removeClass('site-search-active');
    }
}

/**
 * Retrieve suggestions
 *
 * @param {Object} scope - Search field DOM element
 */
function getSuggestions(scope) {
    if ($(scope).val().length >= minChars) {
        $.spinner().start();
        $.ajax({
            context: scope,
            url: endpoint + encodeURIComponent($(scope).val()),
            method: 'GET',
            success: processResponse,
            error: function () {
                $.spinner().stop();
            }
        });
    } else {
        toggleSuggestionsIcon('search');
        getSuggestionsWrapper(scope).empty();
    }
}


$(function () {

    $('input.product-search-field').each(function () {
        var debounceSuggestions = debounce(getSuggestions, 300);

        $(this).on('keyup click', function (e) {
            debounceSuggestions(this, e);
        });
    });
    
    $('body').on('click', function (e) {
        if (!$('.suggestions').has(e.target).length && !$(e.target).hasClass('search-field')) {
            $('.suggestions').hide();
        }
    });

    $('body').on('click touchend', '.search-mobile span.fa-close', function () {
        $('.suggestions').hide();
        $('body').removeClass('site-search-active');
        toggleSuggestionsIcon('search');
        tearDownSuggestions();
    });

    $('.mobile-search_btn').on('click', function () {
        $('body').toggleClass('site-search-active');
    });

    $('body').on('product:suggestion-selected', function (e, productName) {
        tearDownSuggestions(productName);
    });

});
  