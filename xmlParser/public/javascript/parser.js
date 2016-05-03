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
          self = this,
          errors = this.validate();
      if (errors.count){
         this._setErrors(errors, ['count']);
         return;
      }
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
self._getRows().find('.parser-validation-error').removeClass('parser-validation-error');
            window.open(location.href + 'data/output.xml', '_blank');
            self._toggleErrors(true);
         }
         else{
            
            self._setErrors(JSON.parse(res), ['count'], true);
         }
      });
   }

   validate() {
      //Добавил функцию валидации, но по факту нигде не заюзал.
      let rows = this._getRows();
      if (!rows.length) {
         return true;
      }
      let errors = {
         count: 0
      },
         valuesContainer,
         valueContainer,
         type;
      for (let i = 0, l = rows.length; i < l; i++) {
         valuesContainer = $('.parser-item-cell', rows[i]);
         for(let j = 0, k = valuesContainer.length; j < k; j++){
            valueContainer = $(valuesContainer[j]);
            type = valueContainer.data('type') || 'String';
            if (type.includes('Int')) {
               if (!valueContainer.text().length){
                  errors.count++;
                  errors.intBadField = 'Значения в поле с типом Int32 должны быть валидны типу integer';
               }
            }
            else if (type.includes('String') && !valueContainer.text()){
               errors.count++;
               errors.stringEmpty = 'Поля не могут быть пустыми';
            }
         }
      }
      return errors;
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
      valueContainer.on('focusin', function(){
         $(this).data('value', $(this).text());
      });

      valueContainer[0].addEventListener("input", function(e) {
         if (!$(this).data('type').includes('Int')){
            return;
         }
         var oldValue = $(this).data('value'),
            newValue = parseInt(this.textContent),
            $textContainer = $(this),
            isNaNValue = isNaN(newValue),
            isError = isNaNValue || newValue.toString().length !== this.textContent.length;
         if (isError && this.textContent !== '' && this.textContent !== '-' || newValue.toString().length > 10){
            var currentOffset = getSelection().anchorOffset;
            var dif = this.textContent.length - oldValue.toString().length;

//test
            currentOffset -= dif;
            $textContainer.text(oldValue);
	    var range = document.createRange();
	    var sel = window.getSelection();
	    range.setStart(this.childNodes[0], currentOffset);
	    range.collapse(true);
	    sel.removeAllRanges();
	    sel.addRange(range);
         }
         else{
            $(this).data('value', isNaN(newValue) ? this.textContent : newValue);
         }
         //$textContainer.toggleClass('parser-validation-error', isError);
      }, false);
      itemTpl.append(valueContainer);

      itemTpl.append($('<div class="parser-item-cell parser-type" field="Type"></div>').text(item.Type[0].split('.')[1]));
      return itemTpl;
   }

getSelection()
{
    var savedRange;
    if(window.getSelection && window.getSelection().rangeCount > 0) //FF,Chrome,Opera,Safari,IE9+
    {
        savedRange = window.getSelection().getRangeAt(0).cloneRange();
    }
    else if(document.selection)//IE 8 and lower
    { 
        savedRange = document.selection.createRange();
    }
    return savedRange;
}

   _setErrors(errors = {}, ignoreKeys = [], save){
      let out = '<ul>';
      if (save){
         this._getRows().find('.parser-validation-error').removeClass('parser-validation-error');
      }
      $.each(errors, function(k, v){
         if (!ignoreKeys.includes(k)){
            out += '<li>' + v + '</li>';
         }
if (save){
	  if( k == 'booleanHasTrueValue'){
            this._getRows().find('[data-type="System.Boolean"]').addClass('parser-validation-error')
          }
          else if (k == 'intRange'){
   	     var intFields = this._getRows().find('[data-type="System.Int32"]');
             for (var i = 0; i < intFields.length; i++){
	        if (+$(intFields[i]).text() < -255 || +$(intFields[i]).text() > 255){
                   $(intFields[i]).addClass('parser-validation-error');
                }
             }
          }
          else if (k == 'stringLength'){
             var strFields = this._getRows().find('[data-type="System.String"]');
             for (var i = 0; i < strFields.length; i++){
	        if ($(strFields[i]).text().length > 10){
                   $(strFields[i]).addClass('parser-validation-error');
                }
             }
          }
}
      }.bind(this));
      this._errorContainer.html(out + '</ul>').removeClass('parser-hidden');
   }
   _toggleErrors(toggle){
      this._errorContainer.toggleClass('parser-hidden', !!toggle);
   }
}