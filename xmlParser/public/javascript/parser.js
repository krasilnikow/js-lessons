/**
 * Created by Andrew on 03.04.2016.
 */
'use strict';

class Parser {
   constructor() {
      this._data = [];
      this._container = undefined;
   }

   getData() {
      return $.ajax({
         type:"POST",
         url: 'getInputXml'
      })
   }

   setData(data) {
      if (typeof(data)) {
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
      var headData = {
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
         var $target = $(event.target),
            row = $target.closest('.parser-item-row');
         if (event.which == 3){ //Удаляем запись по нажатию ПКМ. Интуитивно понятный интерфейс наше все
            if (confirm('Удалить запись?')){
               row.remove();
            }
            return;
         }
         var typeData = {
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


      var controlsButtons = $('<div id="controlButtons">' +
         '<img src="images/add.png" onclick="setCommand(\'addRow\')"/>' +
         '<img src="images/save.png" onclick="setCommand(\'save\')"/></div>');
      controlsButtons.insertAfter(this._container);

      var deleteButton = $('<div id="deleteButton"><img src="images/delete.png" onclick="setCommand(\'deleteRow\')"/></div>').insertAfter(this._container);
   }

   addRow() {
      var emptyData = {
         Id: '',
         Name: '',
         Description: '',
         Value: '',
         Type: ['Type.String']
      };
      var itemTpl = this._getItemTpl(emptyData).addClass('parser-item-new');
      $('.parser-item-cell:not(.parser-type)', itemTpl).attr('contenteditable', true);
      this._container.append(itemTpl);
   }

   save() {
      var rows = this._getRows();
      if (!rows.length) {
         return;
      }
      var newData = [];
      for (var i = 0, l = rows.length; i < l; i++){
         var cells = $('.parser-item-cell', rows[i]);
         var rowData = {};
         var $cell;
         var field;
         for (var j = 0; j < cells.length; j++){
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
         alert(res);
      });
   }

   validate() {
      //Добавил функцию валидации, но по факту нигде не заюзал.
      var rows = this._getRows();
      if (!rows.length) {
         return true;
      }
      var hasErrors = false,
         valueContainer,
         type;
      for (var i = 0, l = rows.length; i < l; i++) {
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
      itemTpl.append($('<div class="parser-item-cell" field="Id"></div>').text(item.Id));
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