const vscode = require('vscode');
const superagent = require('superagent');
const baseUrl = 'https://stock.xueqiu.com/v5/stock/realtime/quotec.json?symbol=';
let statusBarItems = {};
let stockCodes = [];
let updateInterval = 10000;
let timer = null;

function activate(context) {
	init();
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(handleConfigChange));
}
exports.activate = activate;

function deactivate() {

}
exports.deactivate = deactivate;

function init() {
	stockCodes = getStockCodes();
	updateInterval = getUpdateInterval();
	fetchAllData();
	timer = setInterval(fetchAllData, updateInterval);
}

function handleConfigChange() {
	timer && clearInterval(timer);
	const codes = getStockCodes();
	console.log(codes)
	Object.keys(statusBarItems).forEach((item) => {
		if (codes.indexOf(item) === -1) {
			statusBarItems[item].hide();
			statusBarItems[item].dispose();
			statusBarItems[item] = false;
		}
	});
	init();
}

function getStockCodes() {
	const config = vscode.workspace.getConfiguration();
	const stocks = config.get('stock-watch.stocks');
	return stocks;
}

function getUpdateInterval() {
	const config = vscode.workspace.getConfiguration();
	return config.get('stock-watch.updateInterval');
}

function fetchAllData() {
	// @ts-ignore
	superagent.get(`${baseUrl}${stockCodes.join(',')}`)
		.then((rep) => {
			const result = JSON.parse(rep.text);
			if (result.data.length) {
				displayData(result.data);
			}
		}, (error) => {
			console.error(error);
		}).catch((error) => {
			console.error(error);
		});
}

function displayData(data) {
	data.map((item) => {
		console.log(item)
		const key = item.symbol;
		if (statusBarItems[key]) {
			statusBarItems[key].text = `「${item.high}」${keepTwoDecimal(item.low)} ${item.percent > 0 ? '📈' : '📉'} ${keepTwoDecimal(item.percent)}%`;
		} else {
			statusBarItems[key] = createStatusBarItem(item);
		}
	});
}

function createStatusBarItem(item) {
	const message = `「${item.high}」${keepTwoDecimal(item.low)} ${item.percent > 0 ? '📈' : '📉'} ${keepTwoDecimal(item.percent)}%`;
	const barItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	barItem.text = message;
	barItem.show();
	return barItem;
}

function keepTwoDecimal(num) {
	var result = parseFloat(num);
	if (isNaN(result)) {
		return '--';
	}
	return result.toFixed(2);
}