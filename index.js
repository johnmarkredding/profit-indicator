/*jshint browser: true, esversion: 6*/
/*global require, console*/

const http = require('http');
const fs = require('fs');
const	parseXML = require('xml2js').parseString;

const	hostname = '127.0.0.1';
const	port = 3000;

const zillowProperty = {
	taxrate: '0.0119',
	yearlydivisions: '12',
	noi: '',
};
zillowProperty.propertytax = zillowProperty.taxrate * zillowProperty.assessment;

const zillowSearch = {
	api: 'http://www.zillow.com/webservice/GetDeepSearchResults.htm',
	id: 'X1-ZWz1g3mtv64bgr_aj9j5',
	address: '83+donelson+st',
	cityStateZip: 'Nashville%2C%20tn',
	rentzestimate: 'true'
};
zillowSearch.url = `${zillowSearch.api}?zws-id=${zillowSearch.id}&address=${zillowSearch.address}&citystatezip=${zillowSearch.cityStateZip}&rentzestimate=${zillowSearch.rentzestimate}`;

const server = http.createServer((req, res) => {
	res.setHeader('Content-Type', 'text/html');
	res.statusCode = 200;
	let q = new URL(`http://${hostname}:${port}${req.url}`);	
	let filename = './index.html';
	
	if (q.pathname == '/') {
		filename = './index.html';
	} else {
		filename = `./${q.pathname}`;
	}
	fs.readFile(filename, function validPath(err, data) {
		if (err) {
			res.statusCode = 404;
			data = '404. Not Found.';
		}
		res.write(data);
		res.end();
		return res;
	});
});

server.listen(port, hostname, function serverMessage() {
	console.log(`Server running at http://${hostname}:${port}`);
});

const callZillow = http.get(zillowSearch.url, (res) => {
	const statusCode = res.statusCode;
  const contentType = res.headers['content-type'];

	console.log(`Status Code: ${statusCode}`);
	console.log(`Content-type: ${contentType}`);
	
	let data = '';
	res.on('data', (chunk) => {
		data += chunk;
	});
	res.on('end', () => {
		parseXML(data, (err, result) => {
			result = result['SearchResults:searchresults'].response[0].results[0].result[0];
			
			zillowProperty.price = result.zestimate[0].amount[0]._;
			zillowProperty.rent = result.rentzestimate[0].amount[0]._ * zillowProperty.yearlydivisions;
			zillowProperty.tax = result.taxAssessment[0] * zillowProperty.taxrate;
			zillowProperty.insurance = 0.01;
			zillowProperty.vacancyallowance = 0.07 * zillowProperty.rent;
			zillowProperty.managementfee = 0.1 * zillowProperty.rent;
			zillowProperty.mortgageperiod = 30;
			zillowProperty.interest = 0.045;
			zillowProperty.m = '';
			
			console.log(`Details: ${zillowProperty}`);
			console.log(result);
		});
	});
});