var tblModules;

var groups = {
    details: {
        modules: [],
    },
    list: function () {
        tblModules = $('#tblModules').DataTable({
            // responsive: true,
            // autoWidth: false,
            destroy: true,
            data: this.details.modules,
            lengthChange: false,
            paging: false,
            scrollX: true,
            scrollCollapse: true,
            columns: [
                {data: "id"},
                {data: "name"},
                {data: "name"},
                {data: "state"},
                {data: "permits"},
            ],
            columnDefs: [
                {
                    targets: [-3],
                    orderable: false,
                    render: function (data, type, row) {
                        if (!$.isEmptyObject(row.moduletype)) {
                            return row.moduletype.name;
                        }
                        return 'Ninguno';
                    }
                },
                {
                    targets: [-2],
                    orderable: false,
                    class: 'text-center',
                    render: function (data, type, row) {
                        var state = row.state === 1 ? " checked" : "";
                        var html = '<div class="checkbox">';
                        html += '<label><input type="checkbox" name="module"' + state + '></label>';
                        html += '</div>';
                        return html;
                    }
                },
                {
                    targets: [-1],
                    orderable: false,
                    render: function (data, type, row) {
                        var html = "";
                        $.each(row.permits, function (position, item) {
                            var state = item.state === 1 ? " checked" : "";
                            html += '<div class="form-check form-check-inline">';
                            html += '<input class="form-check-input" type="checkbox" data-position="' + position + '" name="permit"' + state + '>';
                            html += '<label class="form-check-label">' + item.codename + '</label>';
                            html += '</div>';
                        });
                        return html;
                    }
                },
            ],
            order: [[0, 'asc']],
            rowCallback: function (row, data, displayNum, displayIndex, dataIndex) {
                if (data.state === 0) {
                    var tr = $(row).closest('tr');
                    tr.find('input[name="permit"]').prop('disabled', true);
                }
            }
        });
    },
    getPermits: function () {
        let modules = tblModules.rows().data().toArray();
        let data = [];
        modules.filter(value => value.state === 1).forEach(function (value, key) {
            if (!$.isEmptyObject(value.permits)) {
                value.permissions = value.permits.filter(value => value.state === 1);
            }
            data.push(value);
        });
        return data;
    }
};

document.addEventListener('DOMContentLoaded', function (e) {
    const form = document.getElementById('frmGroup');
    const fv = FormValidation.formValidation(form, {
            locale: 'es_ES',
            localization: FormValidation.locales.es_ES,
            plugins: {
                trigger: new FormValidation.plugins.Trigger(),
                submitButton: new FormValidation.plugins.SubmitButton(),
                bootstrap: new FormValidation.plugins.Bootstrap(),
                icon: new FormValidation.plugins.Icon({
                    valid: 'fa fa-check',
                    invalid: 'fa fa-times',
                    validating: 'fa fa-refresh',
                }),
            },
            fields: {
                name: {
                    validators: {
                        notEmpty: {},
                        stringLength: {
                            min: 2,
                        },
                        remote: {
                            url: pathname,
                            data: function () {
                                return {
                                    obj: form.querySelector('[name="name"]').value,
                                    type: 'name',
                                    action: 'validate_data'
                                };
                            },
                            message: 'El nombre ya se encuentra registrado',
                            method: 'POST',
                            headers: {
                                'X-CSRFToken': csrftoken
                            },
                        }
                    }
                },
            },
        }
    )
        .on('core.element.validated', function (e) {
            if (e.valid) {
                const groupEle = FormValidation.utils.closest(e.element, '.form-group');
                if (groupEle) {
                    FormValidation.utils.classSet(groupEle, {
                        'has-success': false,
                    });
                }
                FormValidation.utils.classSet(e.element, {
                    'is-valid': false,
                });
            }
            const iconPlugin = fv.getPlugin('icon');
            const iconElement = iconPlugin && iconPlugin.icons.has(e.element) ? iconPlugin.icons.get(e.element) : null;
            iconElement && (iconElement.style.display = 'none');
        })
        .on('core.validator.validated', function (e) {
            if (!e.result.valid) {
                const messages = [].slice.call(form.querySelectorAll('[data-field="' + e.field + '"][data-validator]'));
                messages.forEach((messageEle) => {
                    const validator = messageEle.getAttribute('data-validator');
                    messageEle.style.display = validator === e.validator ? 'block' : 'none';
                });
            }
        })
        .on('core.form.valid', function () {
            var parameters = new FormData($(form)[0]);
            parameters.delete('module');
            parameters.delete('permit');
            parameters.append('groups_json', JSON.stringify(groups.getPermits()));
            submit_formdata_with_ajax('Notificación',
                '¿Deseas seguro de realizar la siguiente acción?',
                pathname,
                parameters,
                function () {
                    location.href = fv.form.getAttribute('data-url');
                }
            )
        });
});

$(function () {

    $('#tblModules tbody')
        .off()
        .on('change', 'input[name="module"]', function () {
            var tr = tblModules.cell($(this).closest('td, li')).index(),
                row = tblModules.row(tr.row).data();
            row.state = this.checked ? 1 : 0;
            if (row.permits.length > 0) {
                $(tblModules.row(tr.row).node())
                    .find('input[name="permit"]')
                    .prop('disabled', !this.checked)
                    .prop('checked', this.checked).trigger('change');
            }
        })
        .on('change', 'input[name="permit"]', function () {
            var position = parseInt($(this).data('position'));
            var tr = tblModules.cell($(this).closest('td, li')).index(),
                row = tblModules.row(tr.row).data();
            row.permits[position].state = this.checked ? 1 : 0;
        });

    $('input[name="selectall"]')
        .on('change', function () {
            var state = this.checked;
            var cells = tblModules.cells().nodes();
            $(cells).find('input[name="module"]').prop('checked', state).trigger('change');
        });
});





