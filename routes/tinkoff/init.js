const https = require('https');

//https://oplata.tinkoff.ru/landing/develop/documentation/parametres

exports.get = function(req, res, next){

	const options = {
		host: 'securepay.tinkoff.ru',
		port: 443,
		path: '/rest/Init', // /rest/Init?TerminalKey=TestB&Amount=100000&OrderId=21050&Description=1000&DATA=Email=a@test.com
		method: 'GET'
	};

	const req = https.request(options, (res) => {
		let receivedData = '';
		res.on('data', (d) => {
			receivedData += d;
		});

		res.on('end', () => {
			str = JSON.parse(receivedData);

		});
	});

	req.on('error', (e) => {
		console.error(e);
	});

	req.end();

};