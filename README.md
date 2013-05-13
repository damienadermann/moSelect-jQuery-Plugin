TODO

Example use:

            $('#status-select').moSelect( {
                selected: ['active', 'inactive'],
                name: 'active-filter[]',
                values : [
                    {
                        label: 'Active',
                        value: 'active'
                    },
                    {
                        label: 'Inactive',
                        value: 'inactive'
                    }
                ]
            });

            $('#dealer-groups-select').moSelect( {
                selected: [1,2,3,4,5],
                name: 'somename[]',
                values : [
                    {
                        group: 1,
                        label: 'cheese',
                        value: 1
                    },
                    {
                        group: 1,
                        label: 'olive',
                        value: 2
                    },
                    {
                        label: 'fork',
                        value: 3
                    },
                    {
                        label: 'knife',
                        value: 4
                    },
                    {
                        group: 2,
                        label: 'steak',
                        value: 5
                    },
                ],
                groups: [
                    {
                        id : 1,
                        label : 'snacks'
                    },
                    {
                        id : 2,
                        label : 'mains'
                    }
                ]
            });
