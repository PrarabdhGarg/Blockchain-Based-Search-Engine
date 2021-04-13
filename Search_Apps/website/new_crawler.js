'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');
const IPFS = require('ipfs-core')
const prompt = require('prompt-sync')({sigint: true});
const extractor = require('unfluff');
const axios = require('axios').default;
const countWords = require("count-words");
const homedir = require('os').homedir();
// const console = require('node:console');


const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';
var smartContract = null
var ipfs = null
var gateway

async function readFileFromIpfs(cid) {
	try {
		for await (const file of ipfs.get(cid)) {
			console.log(file.type, file.path)
		
			if (!file.content) continue;
		
			const content = []
		
			for await (const chunk of file.content) {
				content.push(chunk)
			}
		
			return content.toString()
		}
	} catch (e) {
		return ""
	}
}

async function myFunctionCrawl(url) {
	ipfs = await IPFS.create({
		repo: path.join(homedir, "/IPFS/data/")
	})
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
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		gateway = new Gateway();

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

			// const result = await smartContract.submitTransaction('ReadWord', 'word100')
			// console.log('*** Result: committed ', result.toString());
			
			
		
			var res =  await foo(url)
			console.log("Result = " + res)
			return res
				
		
		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			// gateway.disconnect();
		}


	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
    }
    
    
}


async function foo(url) {

	var startTime = process.hrtime()
	const response = await axios.get(url);
	// console.log(response)
	var body = response.data;
	// console.log("Body = " + body)
        
	var data = extractor(body);
	// console.log(data.text)
	// var words = countWords(data.text);
	var words = countWords(data.text.toLowerCase(), true);
	// console.log(words)
	// words.forEach(async (key, value) => {
	// 	var isNew = false;
	// 	const result = await contract.submitTransaction('ReadWord', key)
	// 	console.log('File id for word ' + key.toString() + ' = ' + result.toString())
	// 	var fileContents = await readFileFromIpfs(result.toString())
	// 	if(fileContents == '') 
	// 		isNew = true
	// 	console.log('Old File contents = ' + fileContents)
	// 	fileContents = fileContents + url + '\t' + value.toString() + '\n'
	// 	console.log('New File contents = ' + fileContents)
	// 	const { newPath } = await ipfs.add(fileContents)
	// 	console.log('New Path = ' + newPath)
	// 	if(isNew) {
	// 		const result = await contract.submitTransaction('CreateWord', key, newPath)
	// 		console.log('Result of CreateWord = ' + result.toString())
	// 	} else {
	// 		const result = await contract.submitTransaction('UpdateWord', key, newPath)
	// 		console.log('Result of UpdateWord = ' + result.toString())
	// 	}
	// }

	var commonWords = ['the', 'of', 'a', 'and', 'to', 'in', 'is', 'you', 'that', 'it', 'he', 'was', 'for', 'on', 'are', 'as',
					   'with', 'his', 'they', 'i', 'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but',
					   'not', 'what', 'all', 'were', 'we', 'when', 'your', 'can', 'said', 'there', 'use', 'an', 'each', 'which',
					   'she', 'do', 'how', 'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many', 'then', 'them', 'these',
					   'so', 'some', 'her', 'would', 'make', 'like', 'him', 'into', 'time', 'has', 'look', 'two', 'more', 'write',
					   'go', 'see', 'no', 'way', 'could', 'my', 'then', 'been', 'call', 'who', 'its', 'now', 'did', 'get', 'come']
	var useful = 0;
	
	for (var key in words){
		if(commonWords.includes(key.toLowerCase())) {
			continue;
		} else {
			useful++;
			console.log( key, words[key] );
			var value = words[key];
			var isNew = false;
			
			var result
			result = await smartContract.submitTransaction('ReadWord', key.toString())

			console.log(result.toString())

			if(!result.toString()) {
				result = ''
				isNew = true
			}
			var fileContents = ''
			console.log("isNew = " + isNew)
			if(!isNew) {
				console.log('File id for word ' + key.toString() + ' = ' + JSON.parse(result.toString()).path)
				fileContents = await readFileFromIpfs(JSON.parse(result.toString()).path)
			}
			
			// if(fileContents == '') 
				// isNew = true
			// fileContents = fileContents.substring(0, fileContents.length - 1)
			console.log('Old File contents = ' + fileContents)
			fileContents = fileContents + url + '\t' + value.toString() + '\n'
			console.log('New File contents = ' + fileContents)
			const { cid } = await ipfs.add(fileContents)
			console.log('New Path = ' + cid)
			if(isNew) {
				const result = await smartContract.submitTransaction('CreateWord', key, cid)
				console.log('Result of CreateWord = ' + result.toString())
			} else {
				const result = await smartContract.submitTransaction('UpdateWord', key, cid)
				console.log('Result of UpdateWord = ' + result.toString())
			}
		}
	}
	var endTime = process.hrtime(startTime)
	console.log('Website crawled sucessfully in %ds %dms', endTime[0], endTime[1]/1000000);
	console.log('Words = %d', Object.keys(words).length)
	console.log('Useful = %d', useful)
	ipfs.stop();
	return "Website crawlled sucessfully"
	// gateway.disconnect()
	
	
}

module.exports.myFunctionCrawl = myFunctionCrawl