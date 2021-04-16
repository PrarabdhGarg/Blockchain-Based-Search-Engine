'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');
const prompt = require('prompt-sync')({sigint: true});
const axios = require('axios').default;


const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet1');
const org1UserId = 'appUserClient';
var smartContract = null
var ipfs = null

async function myFunction(text) {
	// alert('Hello')
	// ipfs = await IPFS.create()
	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department2');

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(channelName);

			// Get the contract from the network.
			smartContract = network.getContract(chaincodeName);

			// const result = await smartContract.evaluateTransaction('ReadWord', 'word100')
			// console.log('*** Result: committed ', result.toString());
			var cont = true;
			// while(cont) {
				// console.log("Here")
				return await foo(text)
			// }
		
		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			// gateway.disconnect();
		}


	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
    }
    
    
}

function sortByValue(jsObj){
    var sortedArray = [];
    for(var i in jsObj)
    {
        console.log(i)
        console.log(jsObj[i])
        // Push each JSON Object entry in array by [value, key]
        sortedArray.push([Number(jsObj[i]), i]);
    }
    return sortedArray.sort();
}


async function foo(text) {
    // const searchWord = prompt('Enter search term: ');
    // console.log('Search term entered', searchWord);
	var startTime = process.hrtime()
    var result = await smartContract.submitTransaction('Lookup', text.toString())
    console.log('Result from smart contract = ' + result.toString())
	result = JSON.parse(result.toString())
	var sortedArray = sortByValue(result)
	var returnValue = {}
	console.log('SortedArray = ' + sortedArray)
	for(let x of sortedArray) {
		console.log("Url = " + x[1].toString())
		var response = await axios.get(x[1].toString());
		var body = response.data;
		console.log("Before body.match " + body)
		var match = body.match(/<title>([^<]*)<\/title>/i,)
		// console.log('Match = ' + match[1])
		returnValue[x[1]] = {
			title: match != null ? match[1] : x[1],
			frequency: x[0]
		}
	}
	console.log("Return Value = " + JSON.stringify(returnValue))
	var endTime = process.hrtime(startTime)
	console.log('Search results returned in %ds %dms', endTime[0], endTime[1]/1000000);
	return JSON.stringify(returnValue)
}

module.exports.myFunction = myFunction