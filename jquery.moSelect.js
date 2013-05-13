/**
 * Creates a multi-select dropdown
 *
 * Author: Damien Adermann
 */
;(function( $, _, window, document, undefined ) {

    //List Model
    function GroupList(params) {

        this.init = function(params) {
            this.groups = params.groups;

            this.selectedValues = (params.selected === undefined || params.selected === 'all')? 
                this.allValues():
                params.selected;

            return this;
        };

        this.getList = function() {
            return this.groups;
        };

        this.getSelectedValues = function() {
            return this.selectedValues;
        };

        this.getTextDescription = function() {

            if(this.allSelected()) {
                return 'All';
            }

            if(this.selectedValues.length === 0) {
                return 'None';
            }

            //All selected values that doesn't have a selected group
            var nonSelectedGroupValuesNames = _(this.groups).chain()
                .pluck('values')
                .flatten()
                .filter(function(value) {
                    return value.group?
                        !_(this.groupsSelected()).contains(value.group) && _(this.selectedValues).contains(value.value):
                        _(this.selectedValues).contains(value.value);
                }, this)
                .pluck('label')
                .toArray()
                .value();

            var groupsAndNames =  _.compact([this.groupsSelectedNames().join(', '), nonSelectedGroupValuesNames.join(', ')]);
            return groupsAndNames.join(', ');


        };

        this.getTextDescriptionLimitedLength = function() {
            var description = this.getTextDescription();
            return description.length > 25? description.substr(0, 24) + "...": description;
        };

        this.groupsSelectedNames = function() {
            return _(this.groups).chain()
                .filter(function(group) {
                    return group.id != 'groupless' && _.contains(this.selectedGroups, group.id);
                }, { selectedGroups :this.groupsSelected() })
                .pluck('label')
                .toArray()
                .value()
        };

        this.groupsSelected = function() {
            var self = this;
            return _(this.groups)
                .chain()
                .filter(function(group){
                    return group.values.length === _.intersection(_(group.values).pluck('value'), self.selectedValues).length;
                })
                .pluck('id')
                .toArray()
                .value();
        };

        this.allSelected = function() {
            return this.selectedValues.length === _(this.groups).reduce(function(count, group) {
                return count + group.values.length;
            }, 0);
        };

        this.allValues = function() {
            var allValues = _(this.groups).reduce(function(values, group) {
                return _.union(values, _(group.values).pluck('value'));
            },[]);
            allValues.sort();
            return allValues;
        };

        this.toggleAll = function() {
            this.selectedValues = this.allSelected()? []: this.allValues();
            return this;
        };

        this.toggleGroup = function(groupId) {
            var group = _(this.groups).find(function(group) {
                return group.id === groupId;
            });

            if(_(this.groupsSelected()).contains(groupId)) {// if group is selected
                this.selectedValues = _.difference(this.selectedValues, _(group.values).pluck('value'));
            } else {
                this.selectedValues = _.union(this.selectedValues, _(group.values).pluck('value'));
            }
            return this;
        };

        this.toggleValue = function(valueId) {
            this.selectedValues = (_(this.selectedValues).contains(valueId)) ?
                _(this.selectedValues).without(valueId):
                this.selectedValues.concat(valueId);

            this.selectedValues.sort();
            return this;
        }

        return this.init(params);
    }

    // Create the defaults once
    var pluginName = "moSelect",
        defaults = {
            selected : [],
            name : 'multiselectValue',
            groupName : false,
            allName : false,
            values : [

            ],
            groups : [

            ]
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;

        this.options = _.extend( {}, defaults, options );

        this.config = {
        };

        this._defaults = defaults;
        this._name = pluginName;

        this.template = [
            '<div class="moselect-box">',
            '   <div class="moselect-description"><%= description.length > 25? description.substr(0, 24) + "...": description %></div>',
            '</div>',
            '<div class="moselect-wrapper">',
            '</div>'
        ].join("\n");

        this.selectTemplate = [
            '<ul>',
            '   <li>All<input type="checkbox" class="moselect-all-selected" <% if(allName){ %>name="<%= allName %>"<% } %> <% if(allSelected){ print("checked=checked"); }  %>></li>',
            '<% _(groups).each(function(group) { %>',
            '   <% if(group.id === "groupless") { %>',
            '       <li><span class="moselect-groupless-label"><%= group.label %></span><input type="checkbox" class="moselect-value-toggle" name="<%= inputName %>" value=<%= group.values[0].value %>  <% if(_(selected).contains(group.values[0].value)){ print("checked=checked"); }  %> /></li>',
            '   <% } else { %>',
            '       <li><span class="moselect-group-label"><%= group.label %><input type="checkbox" class="moselect-group-toggle" <% if(groupName){ %>name="<%= groupName %>" <% } %> value=<%= group.id %> <% if(_(groupsSelected).contains(group.id)){ print("checked=checked"); } %> />',
            '           <ul>',
            '           <% _(group.values).each(function(value) { %>',
            '               <li><span class="moselect-value-label"><%= value.label %></span><input type="checkbox" class="moselect-value-toggle" name="<%= inputName %>" value=<%= value.value %> <% if(_(selected).contains(value.value)){ print("checked=checked"); } %> /></li>',
            '           <% }); %>',
            '           </ul>',
            '       </li>',
            '   <% }%>',
            '<% }); %>',
            '</ul>'
        ].join("\n");

        this.init();
    }


    Plugin.prototype = {

        init: function() {

            this.processOptions();

            this.groupList = new GroupList({groups : this.groups, selected : this.options.selected});

            this.buildMultiSelect();
        },

        processOptions : function() {
            var self = this,
                group;

            this.stringifyOptions();

            self.groups = _(this.options.groups).map(function(group) {
                return _(group).extend({values : []});
            });

            self.groupName = this.options.groupName;
            self.allName = this.options.allName;


            _(self.options.values).each(function(value) {
                if(value.group > 0) {
                    group = _(self.groups).findWhere({id : value.group});

                    if(group) {
                        group.values.push(value);
                        return;
                    } else {
                       throw new Error("No matching group " + value.group);
                    }
                }
                self.groups.push({
                    id : 'groupless',
                    label : value.label,
                    values : [value]
                });

            });
            self.groups = _(self.groups).sortBy('label');
        },

        stringifyOptions : function() {
            //Stringify input number values
            if(typeof this.options.selected !== "string") {
                this.options.selected = _(this.options.selected).map(function(value) {
                    return '' + value;
                });
            }

            this.options.values = _(this.options.values).map(function(value) {
                value.value += '';
                value.group += '';
                return value;
            });

            this.options.groups = _(this.options.groups).map(function(group) {
                group.id += '';
                return group;
            });
        },

        buildMultiSelect : function() {
            this.render();
            this.renderSelect();
            this.bindEvents();
        },

        updateSelected : function() {
            $(this.element).find('.moselect-description').html(this.groupList.getTextDescriptionLimitedLength());
            this.renderSelect();
        },

        bindEvents : function() {
            var self = this,
                $el = $(this.element);

            $el.on('change', '.moselect-value-toggle', function() {
                self.groupList.toggleValue($(this).val());
                self.updateSelected();
            });

            $el.on('change', '.moselect-group-toggle', function() {
                self.groupList.toggleGroup($(this).val());
                self.updateSelected();
            });

            $el.on('change', '.moselect-all-selected', function() {
                self.groupList.toggleAll();
                self.updateSelected();
            });

            $el.on('click', '.moselect-box', function() {
                $el.find('.moselect-wrapper').toggle('blind');
            })
        },

        render : function() {
            $(this.element).html(_.template(this.template, { description : this.groupList.getTextDescriptionLimitedLength()}));
        },

        renderSelect : function() {
            var data = {
                groups : this.groupList.getList(),
                selected : this.groupList.getSelectedValues(),
                inputName : this.options.name,
                groupsSelected : this.groupList.groupsSelected(),
                groupName : this.groupName,
                allName : this.allName,
                allSelected : this.groupList.allSelected()
            };


            $(this.element).find('.moselect-wrapper').html(_.template(this.selectTemplate, data));
        }
    };
    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
            }
        });
      };

})( jQuery, _, window, document );
