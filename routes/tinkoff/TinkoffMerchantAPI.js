/**
 * File TinkoffMerchantAPI
 * @author Nozim Yunusov <nozimdev@gmail.com>
 * */

/**
 * Class TinkoffMerchantAPI
 *
 * @author Nozim Yunusov <nozimdev@gmail.com>
 * @property integer     orderId
 * @property integer     Count
 * @property bool|string error
 * @property bool|string response
 * @property bool|string customerKey
 * @property bool|string status
 * @property bool|string paymentUrl
 * @property bool|string paymentId
 */

const crypto = require('crypto');
//const HttpError = require('./../../error').HttpError;
const https = require('https');
// We need this to build our post string
const querystring = require('querystring');
const he = require('he');
const nodeUrl = require('url');
//const { URL, URLSearchParams } = require('url');
//const log = require('./../../lib/log')(module);

function TinkoffMerchantAPI(terminalKey, secretKey, api_url) {
	this._terminalKey = terminalKey;
	this._secretKey = secretKey;
	this._api_url = api_url;

	this._paymentId = '';
	this._status = '';
	this._error = '';
	this._response = '';
	this._paymentUrl = '';
}
	/**
	 * Constructor
	 *
	 * @param string terminalKey Your Terminal name
	 * @param string secretKey   Secret key for terminal
	 * @param string api_url     Url for API
	 */
	// constructor(){
	//
	// }

	/**
	 * Get class property or json key value
	 *
	 * @param mixed $name Name for property or json key
	 *
	 * @return boolean|string
	 */
	TinkoffMerchantAPI.prototype.get= function(name){
		switch(name) {
			case 'paymentId':
				return this._paymentId;
			case 'status':
				return this._status;
			case 'error':
				return this._error;
			case 'paymentUr':
				return this._paymentUrl;
			case 'response':
				return he.encode(this._response); //Преобразует все возможные символы в соответствующие HTML-сущности как php функция htmlentities()
			default:
				if (this._response) {
					var tryJson = tryParse(this._response);
					if (tryJson.valid){
						var json = tryJson.value;
						json.foreach ((name, key , arr) => {
							if (name.toLowerCase() == key.toLowerCase()) {
								return json[key];
							}
						});
					}
				}

				return false;
		}

	};

	/**
	 * Initialize the payment
	 *
	 * @param mixed $args mixed You could use associative array or url params string
	 *
	 * @return bool
	 */
	TinkoffMerchantAPI.prototype.init = function (args, cb) {
		this.buildQuery('Init', args, cb);
	};

	/**
	 * Get state of payment
	 *
	 * @param mixed $args Can be associative array or string
	 *
	 * @return mixed
	 */
	TinkoffMerchantAPI.prototype.getState = function(args, cb)
	{
		this.buildQuery('GetState', args, cb);
	};

	/**
	 * Confirm 2-staged payment
	 *
	 * @param mixed $args Can be associative array or string
	 *
	 * @return mixed
	 */
	TinkoffMerchantAPI.prototype.confirm = function(args, cb)
	{
		this.buildQuery('Confirm', args, cb);
	};

	/**
	 * Performs recursive (re) payment - direct debiting of funds from the
	 * account of the Buyer's credit card.
	 *
	 * @param mixed $args Can be associative array or string
	 *
	 * @return mixed
	 */
	TinkoffMerchantAPI.prototype.charge = function(args, cb)
	{
		this.buildQuery('Charge', args, cb);
	};

	/**
	 * Registers in the terminal buyer Seller. (Init do it automatically)
	 *
	 * @param mixed $args Can be associative array or string
	 *
	 * @return mixed
	 */
	TinkoffMerchantAPI.prototype.addCustomer = function(args, cb)
	{
		this.buildQuery('AddCustomer', args, cb);
	};

	/**
	 * Returns the data stored for the terminal buyer Seller.
	 *
	 * @param mixed $args Can be associative array or string
	 *
	 * @return mixed
	 */
	TinkoffMerchantAPI.prototype.getCustomer = function(args, cb)
	{
		this.buildQuery('GetCustomer', args, cb);
	};

	/**
	 * Devares the data of the buyer.
	 *
	 * @param mixed $args Can be associative array or string
	 *
	 * @return mixed
	 */
	TinkoffMerchantAPI.prototype.removeCustomer = function(args, cb)
	{
		this.buildQuery('RemoveCustomer', args, cb);
	};

	/**
	 * Returns a list of bounded card from the buyer.
	 *
	 * @param mixed $args Can be associative array or string
	 *
	 * @return mixed
	 */
	TinkoffMerchantAPI.prototype.getCardList = function(args, cb)
	{
		this.buildQuery('GetCardList', args, cb);
	};

	/**
	 * Removes the customer's bounded card.
	 *
	 * @param mixed $args Can be associative array or string
	 *
	 * @return mixed
	 */
	TinkoffMerchantAPI.prototype.removeCard = function(args, cb)
	{
		this.buildQuery('RemoveCard', args, cb);
	};

	/**
	 * The method is designed to send all unsent notification
	 *
	 * @return mixed
	 */
	TinkoffMerchantAPI.prototype.resend = function(cb)
	{
		this.buildQuery('Resend', new Array(), cb);
	};

	/**
	 * Builds a query string and call sendRequest method.
	 * Could be used to custom API call method.
	 *
	 * @param string $path API method name
	 * @param mixed  $args query params
	 *
	 * @return mixed
	 * @throws HttpException
	 */
	TinkoffMerchantAPI.prototype.buildQuery = function(path, args, cb)
	{
		var url = this._api_url;
		console.log('buildQuery, url:', url);
		if ( args !== null && typeof args === 'object') {
			if (! ('TerminalKey' in args)) {
				args.TerminalKey = this._terminalKey;
			}
			if (! ('Token' in args)) {
				args.Token = this._genToken(args);
			}
		}
		url = this._combineUrl(url, path);

		this._sendRequest(url, args, cb);
	};

	/**
	 * Generates token
	 *
	 * @param array $args array of query params
	 *
	 * @return string
	 */
	TinkoffMerchantAPI.prototype._genToken = function(args)
	{
		var token = '';
		args['Password'] = this._secretKey;
		ksort(args);
		Object.keys(args).forEach(function(key) {
			token += args[key];
		});

		var hmac = crypto.createHmac('sha256', token);

		//util function
		function ksort(obj){
			var keys = Object.keys(obj).sort()
				, sortedObj = {};

			for(var i in keys) {
				sortedObj[keys[i]] = obj[keys[i]];
			}

			return sortedObj;
		}

		return hmac.digest('hex');
	};




	/**
	 * Combines parts of URL. Simply gets all parameters and puts '/' between
	 *
	 * @return string
	 */
	TinkoffMerchantAPI.prototype._combineUrl = function()
	{
		var args = arguments;

		var url = '';
		Object.keys(args).forEach(function(key) {
			var arg = args[key];
			if (typeof arg == 'string') {
				// if (key == 0) { url = arg; }
				// else { nodeUrl.resolve(url, arg); }
				if (arg[arg.length - 1] !== '/') {
					arg += '/';
				}
				url += arg;

			} else {
				return; //continue
			}
		});
		console.log('_combineUrl, url:', url);

		return url;
	};

	/**
	 * Main method. Call API with params
	 *
	 * @param string $api_url API Url
	 * @param array  $args    API params
	 *
	 * @return mixed
	 * @throws HttpException
	 */
	TinkoffMerchantAPI.prototype._sendRequest = function(api_url, args, callback)
	{
		this._error = '';
		//todo add string $args support
		//$proxy = 'http://192.168.5.22:8080';
		//$proxyAuth = '';
		if ( args !== null && typeof args === 'object') {
			var post_data = querystring.stringify(args)
		}

		console.log('args', args);
		console.log('post_data', post_data);

		const myURL = nodeUrl.parse(api_url);
		console.log('myURL', myURL.host, myURL.path);
		const options = {
			host: myURL.host,
			port: 443,
			path: myURL.path,// + '?'+ post_data,
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(post_data)
			}
		};

		const req = https.request(options, (res) => {
			var out = '';
			res.on('data', (d) => {
				out += d;
			});

			res.on('end', () => { //todo: Как из колбэка получить данные и вернуть во внешнюю функцию. Короче надо чтоб ф-ция _sendRequest могла вернуть out, т.е. return out.
				this._callback(out, callback);
			});
		});
		req.on('error', (e) => {
			console.error(e);
			// throw new HttpError( //HttpException
			// 	`Can not create connection to ${api_url}  with args 
			// 	${args}`, 404);
		});
		// post the data
		req.write(post_data, 'utf8');
		//req.write(JSON.stringify(args), 'utf8');
		console.log('req.path', req.path);
		req.end();

		//return out;

	};

	TinkoffMerchantAPI.prototype._callback = function(out, cb){
		//out = JSON.parse(out);
		this._response = out;
		var tryJson = tryParse(out);
		if (tryJson.valid){
			var json = tryJson.value;
			if (json) {
				if (json.ErrorCode !== "0") {
					this._error = json.Details;
				} else {
					this._paymentUrl = json.PaymentURL;
					this._paymentId = json.PaymentId;
					this._status = json.Status;
				}
			}
		}

		cb(out);

		
	};
	
function tryParse(str) {
	try {
		return {value: JSON.parse(str), valid: true};
	} catch (e) {
		return {value: str, valid: false};
	}
}
	



module.exports = TinkoffMerchantAPI;

// function http_build_query( formdata, numeric_prefix, arg_separator ) {	// Generate URL-encoded query string
// 	//
// 	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// 	// +   improved by: Legaev Andrey
// 	// +   improved by: Michael White (http://crestidg.com)
//
// 	var key, use_val, use_key, i = 0, tmp_arr = [];
//
// 	if(!arg_separator){
// 		arg_separator = '&';
// 	}
//
// 	for(key in formdata){
// 		use_key = escape(key);
// 		use_val = escape((formdata[key].toString()));
// 		use_val = use_val.replace(/%20/g, '+');
//
// 		if(numeric_prefix && !isNaN(key)){
// 			use_key = numeric_prefix + i;
// 		}
// 		tmp_arr[i] = use_key + '=' + use_val;
// 		i++;
// 	}
//
// 	return tmp_arr.join(arg_separator);
// }