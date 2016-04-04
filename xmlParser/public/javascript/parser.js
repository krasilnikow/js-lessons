/**
 * Created by Andrew on 03.04.2016.
 */
'use strict';

let Parser = function(){
   this._data = [];
};

Parser.prototype.setData = function(data){
   if (typeof(data)){
      this._data = JSON.parse(data);
   }
   else if (data instanceof Array){
      this._data = data;
   }
   else{
      throw 'wtf, catch me';
   }
};

Parser.prototype.drawData = function(container){
   function getItemTpl(item){
      //Шаблонизатор года
      let itemTpl =  $('<div class="parser-item-row"></div>');
      $.each(item, function(k, v){
         itemTpl.append($('<div class="parser-item-cell"></div>').text(v));
      });
      return itemTpl;
   }
   for (let i = 0, l = this._data.length; i < l; i++){
      container.append(getItemTpl(this._data[i]));
   }
};
