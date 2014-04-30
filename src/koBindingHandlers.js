// Author: RP Niemeyer
// Date: 1 - June - 2013
// Source: http://stackoverflow.com/a/16876013
// Purpose: Script to allow Knockout to create dynamic binding for tooltip in Bootstrap
ko.bindingHandlers.tooltip = {
    init: function(element, valueAccessor) {
        var local = ko.utils.unwrapObservable(valueAccessor()),
            options = {};

        ko.utils.extend(options, ko.bindingHandlers.tooltip.options);
        ko.utils.extend(options, local);

        $(element).tooltip(options);

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            $(element).tooltip("destroy");
        });
    },
    options: {
        placement: "right",
        trigger: "hover"
    }
};