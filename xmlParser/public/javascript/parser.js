/**
 * Created by Andrew on 03.04.2016.
 */
'use strict';

class Parser {
   constructor() {
      this._data = [];
      this._container = undefined;
      this._errorContainer = undefined;
   }

   getData() {
      return $.ajax({
         type:"POST",
         url: 'getInputXml'
      })
   }

   setData(data) {
      if (typeof(data) === 'string') {
         this._data = JSON.parse(data);
      }
      else if (data instanceof Array) {
         this._data = data;
      }
      else {
         throw 'wtf, catch me';
      }
   };

   drawData(container) {
      this._container = $('<div id="parserAppContainer"></div>').appendTo(container);
      let headData = {
         Id: 'Id',
         Name: 'Name',
         Description: 'Description',
         Value: 'Value',
         Type: ['Type.Type']
      };

      this._container.append(this._getItemTpl(headData, true));

      for (let i = 0, l = this._data.length; i < l; i++) {
         this._container.append(this._getItemTpl(this._data[i]));
      }

      this._container.on('mousedown', function (event) {
         let $target = $(event.target),
            row = $target.closest('.parser-item-row');
         if (event.which == 3){ //Удаляем запись по нажатию ПКМ. Интуитивно понятный интерфейс наше все
            if (confirm('Удалить запись?')){
               row.remove();
            }
            return;
         }
         let typeData = {
               'Type.String': 'Type.Int32',
               'Type.Int32': 'Type.Boolean',
               'Type.Boolean': 'Type.String'
            },
            value,
            type,
            isBooleanType;
         if ($target.hasClass('parser-type')) {
            row = $target.closest('.parser-item-row');
            if (!row.hasClass('parser-item-new')) {
               return;
            }
            value = $('.parser-value', row);
            type = typeData[value.data('type')];
            $target.text(type.split('.')[1]);
            value.data('type', type);
            isBooleanType = type.includes('Boolean');
            value.attr('contenteditable', !isBooleanType);
            if (type.includes('Boolean')) {
               value.html($('<input type="checkbox" />'));
            }
            else {
               value.html('');
            }
         }
      });

      this._errorContainer = $('<div id="parser-errors" class="parser-nav parser-hidden"></div>').insertAfter(this._container);

      let controlsButtons = $('<div id="controlButtons" class="parser-nav">' +
         '<img src="images/add.png" onclick="setCommand(\'addRow\')" title="Добавить запись"/>' +
         '<img src="images/save.png" onclick="setCommand(\'save\')" title="Сохранить"/></div>');
      controlsButtons.insertAfter(this._container);
   }

   addRow() {
      let emptyData = {
         Id: '',
         Name: '',
         Description: '',
         Value: '',
         Type: ['Type.String']
      };
      let itemTpl = this._getItemTpl(emptyData).addClass('parser-item-new');
      $('.parser-item-cell:not(.parser-type)', itemTpl).attr('contenteditable', true);
      this._container.append(itemTpl);
   }

   save() {
      let rows = this._getRows(),
          newData = [],
          self = this;
      for (let i = 0, l = rows.length; i < l; i++){
         let cells = $('.parser-item-cell', rows[i]),
             rowData = {},
             $cell,
             field;
         for (let j = 0; j < cells.length; j++){
            $cell = $(cells[j]);
            field = $cell.attr('field');
            if ($cell.data('type') && $cell.data('type').includes('Boolean')){
               rowData[field] = $('input',$cell).is(':checked');
            }
            else{
               rowData[field] = (field == 'Type' ? 'System.' : '') + $cell.text();
            }
         }
         newData.push(rowData);
      }
      $.ajax({
         url:"/saveXml",
         type:"POST",
         data:"xml="+ JSON.stringify(newData)
      }).done(function(res){
         if (res == 'done!'){
            window.open(location.href + '/data/output.xml', '_blank');
            self._errorContainer.addClass('parser-hidden');
         }
         else{
            let out = '<ul>';
            $.each(JSON.parse(res), function(k, v){
               if (k !== 'count'){
                  out += '<li>' + v + '</li>';
               }
            });
            self._errorContainer.html(out + '</ul>').removeClass('parser-hidden');
         }
      });
   }

   validate() {
      //Добавил функцию валидации, но по факту нигде не заюзал.
      let rows = this._getRows();
      if (!rows.length) {
         return true;
      }
      let hasErrors = false,
         valueContainer,
         type;
      for (let i = 0, l = rows.length; i < l; i++) {
         valueContainer = $('.parser-value', rows[i]);
         type = valueContainer.data('type');
         if (type.includes('Int')) {
            hasErrors = true;
            valueContainer.toggleClass('parser-validation-error', valueContainer.text().search(/[a-z]/i) > -1);
         }
      }
      return !hasErrors;
   }

   _getRows() {
      return $('.parser-item-row:not(.parser-head)', this._container);
   }

   _getItemTpl(item, isHead) {
      //Шаблонизатор года
      let itemTpl = $('<div class="parser-item-row"></div>').addClass(isHead ? 'parser-head' : '');
      itemTpl.append($('<div class="parser-item-cell parser-id" field="Id"></div>').text(item.Id));
      itemTpl.append($('<div class="parser-item-cell" field="Name"></div>').text(item.Name));
      itemTpl.append($('<div class="parser-item-cell" field="Description"></div>').text(item.Description));

      let valueContainer = $('<div class="parser-item-cell parser-value" field="Value"></div>').attr('data-type', item.Type);
      if (item.Type[0].includes('Boolean') && !isHead) {
         valueContainer.append($('<input type="checkbox" />').attr('checked', item.Value[0].includes('True')));
      }
      else {
         valueContainer.text(item.Value).attr('contenteditable', true);
      }
      valueContainer.on('keydown', function(e){
         if ($(this).data('type').includes('Int') && e.keyCode > 57){
            e.preventDefault(false);
         }
      });
      itemTpl.append(valueContainer);

      itemTpl.append($('<div class="parser-item-cell parser-type" field="Type"></div>').text(item.Type[0].split('.')[1]));
      return itemTpl;
   }
}