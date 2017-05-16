/*
 *
 * Front Cocinas client Application
 *
 * Functions:
 *  1 - Get data from the API
 *  2 - Print the display
 *  3 - Listen to User inputs over the data
 *  4 - Call the API to update the data based on user inputs
 *
 * Made with love in js with jQuery and using Mustache.js for templating
 *
 */


// APP vars
var screens_data;
var productos;

// var @refresh_perm
// This var will allow or deny the data autorefresh
// We do this in order to avoid refreshing while updating
// which could cause information lost

var refresh_perm = true;

// Timer option for autorefresh
var timer = 1000;

//API vars
var api_screens_url = "http://localhost/sighore/Impresora2/screens/";
var api_products_url ="http://localhost/sighore/PantallaCocina/";
var api_key = "50e491ca0f221d4406772ffa5c09d9ec1cc17c81";


// APP Functions

// The side-nav clock
function clock(){
  setInterval(function(){
    var currentdate = new Date;
    var time = currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    $('.clock').html(time);
  },1000);
}


// get_products() -> get all the products from the API
function get_products(){

  //Stop any autorefresh
  refresh_perm = false;

  $.get(api_products_url+'all?api_key='+api_key)
    .done(function(data){

      feed_products(data);
    })

}

// feed_products() -> feeds the grid with  previous stored creens and its products
function feed_products(data){

  console.log('feed start')

  productos = JSON.parse(data);

  $(screens_data).each(function(){

    var targetProds = []

    var codigo = $(this)[0].codigo;
    var index = 0;

    //Grep each screen products

    var screen_prods = $.grep(productos, function(e){

       if(e.idImpresora == codigo){

         // We add an index for later manipulation
         // Doing that we avoid to populate the DOM
         // with a lot of data.

         e.index = index;
         index++;

         // Push the product to the screen's array of products;
         targetProds.push(e);



       }
    })

    // Finaly add the array of products to the screen
    $(this)[0].productos = targetProds;

    // Begin templating;
    template = $('#products').html();



    Mustache.parse(template);

     var template_data = {
       "productos": $(this)[0].productos
     }

     var rendered = Mustache.render(template, template_data);
     $('#codigo'+codigo).children('.screen-content').html(rendered);


  })

  // Allow refresh
  refresh_perm = true;

  //Init actions
  actions();

  // Checkout
 //console.log('sync ok')

}


// auto_update()-> call get_products every @var timer ms
// It will only trigger if Refresh perm is allowed
function auto_update(){

  setInterval(function(){
    if (refresh_perm == true){
      get_products()
    }

  },timer)

}

// manual_update will be done calling init_screens();

// init_screens() -> Get screens from API + call get_products
function init_screens(){

  $('.screen-window').remove();

  $.get(api_screens_url+'?api_key='+api_key)
  .done(function(data){
    console.log(data)
    screens_data = JSON.parse(data);

    $(screens_data).each(function(){

      var codigo = $(this)[0].codigo;
      // Begin templating;

      template = $('#screens').html();

      Mustache.parse(template);

       var template_data = {
         "codigo": codigo,
         "nombre": $(this)[0].nombre,
         "productos": $(this)[0].productos
       }

       var rendered = Mustache.render(template, template_data);
       $('.main-window').append(rendered);



    })



    get_products();
    if(($('.screen-window').length % 2) != 0 ){
      $('.screen-window:last-child()').css({
        'width':'95vw'
      })
    }


  });


}

// App User Actions
function actions(){

  $('tr').click(function(){

    //Stop any autorefresh
    refresh_perm = false;

    $('tr').removeClass('active'),
    $(this).addClass('active');

    if($(this).parent().parent().parent().hasClass('side-col')){
      $('#marcar').removeClass();
      $('#marcar').addClass('marcar');
    }else{
      $('#marcar').removeClass();
      $('#marcar').addClass('borrar');
    }

  })

  $('.tr.active').click(function(){
    $(this).removeClass('active');
    $('#marcar').removeClass('active');

    //Stop any autorefresh
    refresh_perm = true;

  })


}

function nav_actions(){

  // Action Marcar to update products state
  $('#marcar').click(function(){

    //Get the product by it'sunique index
    var index = $('tr.active').attr('data-index');
    var producto = $(productos[index])[0];



    //Check state: Pdte || A marchar
    if(producto.Marcado == '' || producto.Marcado == 0){
      //Send to A Marchar

      producto.Marcado = 1;

      console.log('bien')


    }else if(producto.Marcado == '1'){
      //Delete

      console.log('mal')

      producto.Marcado = 2;

    }else{
      console.log('muymal'+producto.Marcado)
    }





    //PUT Update
    $.post(api_products_url+producto.idImpresora+'/'+ producto.idTPV +'/'+producto.idTicket+'/'+producto.idLinea+'/'+producto.idSublinea+'/'+producto.idCombSub+'/'+producto.Marcado+'/?api_key='+api_key)
    .done(function(data){

      //console.log(data)

      feed_products(data)
    })

  })
  //Screen resize actions

  $('.screen-header').click(function(){
    $('.screen-window').addClass('hidden');
    $(this).parent('.screen-window').removeClass('hidden').addClass('active')
  })

  $('#show-screens').click(function(){
    $('.screen-window').removeClass('active');
    $('.screen-window').removeClass('hidden');
  })

  // Force update = update all

  $('#force-update').click(function(){
    refresh_perm = false;
    init_screens();
  })
}

// The trigger on document ready
jQuery(document).ready(function($){
  clock();
  init_screens();
  auto_update();
  nav_actions();
})
