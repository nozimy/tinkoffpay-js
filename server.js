//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));

//========================= working with TINKOFF =========================
router.set('views', path.join(__dirname, 'views'));
router.set('view engine', 'pug');
router.get('/payment',  function (req, res, next) {
	res.render('tinkoff/payment')
});
var TinkoffMerchantAPI = require('./routes/tinkoff/TinkoffMerchantAPI');
router.get('/initpayment',  function (req, res, next) {
	var api = new TinkoffMerchantAPI('Test', 'password', 'https://securepay.tinkoff.ru/rest/');

	var params1 = {
		'OrderId': '669',
		'Amount': '1000',
		'DATA': 'Email=test'
	};
	var params2 = {
		'PaymentId': '147161'
	};
	var params3 = {
		'CustomerKey': '4'
	};
	var params4 = {
		'CustomerKey': '5'
	};
	var params5 = {
		'CardId': '10804',
		'CustomerKey': '5'
	};
	var out = {};
	async.waterfall([
		function (cb) {

			api.init(params1, (out1) => { out.out1= out1; cb() });
		},
		// function (api, cb) {
		// 	api.getState(params2, (out2) => { out.out2 = out2;cb(api) });
		// },
		// function (api, cb) {
		// 	api.confirm(params2, (out3) => { out.out3 = out3; cb(api) });
		// },
		// function (api, cb) {
		// 	api.resend((out4) => {out.out4 = out4;  cb(api) } )
		// },
		// function (api, cb) {
		// 	api.addCustomer(params3, (out5) => { out.out5 = out5;  cb(api) });
		// },
		// function (api, cb) {
		// 	api.getCustomer(params3, (out6) => { out.out6 = out6;  cb(api) });
		// },
		// function (api, cb) {
		// 	api.removeCustomer(params3, (out7) => { out.out7 = out7;  cb(api) });
		// },
		// function (api, cb) {
		// 	api.getCardList(params4, (out8) => { out.out8 = out8;  cb(api) });
		// },
		// function (api, cb) {
		// 	api.removeCard(params5, (out9) => { out.out9 = out9;  cb(api) });
		// }
		], function (err) {
		console.log(api);
			res.render('tinkoff/init', {
				api: api,
				params1: params1,
				params2: params2,
				out: out
			});
		}
	);

});


//==================================================

var messages = [];
var sockets = [];

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
