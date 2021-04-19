#!/bin/bash

if ! [[ -d ./bin ]]
then
    echo "Installing Hyperledger Fabric binaries..."
    ./bootstrap.sh -s
fi
docker container kill ipfs_host
docker container rm ipfs_host
cd ./test-network
./network.sh down
./network.sh up createChannel -ca
cd ../contract-search
export PATH=/usr/local/go/bin:""$PATH""
GO111MODULE=on go mod vendor
cd ../test-network
export PATH="${PWD}"/../bin:"$PATH"
export FABRIC_CFG_PATH="$PWD"/../config/
peer lifecycle chaincode package basic.tar.gz --path ../contract-search/ --lang golang --label basic_1.0
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="${PWD}"/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH="${PWD}"/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
peer lifecycle chaincode install basic.tar.gz
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="${PWD}"/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_TLS_ROOTCERT_FILE="${PWD}"/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH="${PWD}"/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051
peer lifecycle chaincode install basic.tar.gz
PACKAGE_NAME="$(peer lifecycle chaincode queryinstalled | grep "Package ID:" | awk -F ': '  '{print $2}' | rev | cut -c 8- | rev)"
echo "$PACKAGE_NAME"
export CC_PACKAGE_ID="$PACKAGE_NAME"
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel --name basic --version 1.0 --package-id "$CC_PACKAGE_ID" --sequence 1 --tls --cafile "${PWD}"/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_MSPCONFIGPATH="${PWD}"/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_TLS_ROOTCERT_FILE="${PWD}"/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_ADDRESS=localhost:7051
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel --name basic --version 1.0 --package-id "$CC_PACKAGE_ID" --sequence 1 --tls --cafile "${PWD}"/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
peer lifecycle chaincode checkcommitreadiness --channelID mychannel --name basic --version 1.0 --sequence 1 --tls --cafile "${PWD}"/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem --output json
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel --name basic --version 1.0 --sequence 1 --tls --cafile "${PWD}"/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}"/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}"/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
peer lifecycle chaincode querycommitted --channelID mychannel --name basic --cafile "${PWD}"/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}"/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C mychannel -n basic --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}"/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}"/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c '{"function":"InitLedger","Args":[]}'
rm -rf ../Search_Apps/website/wallet/
rm -rf ../Search_Apps/website/wallet1/
export ipfs_staging=~/IPFS/staging/
export ipfs_data=~/IPFS/data/
docker run -d --name ipfs_host  -v "$ipfs_staging":/export -v "$ipfs_data":/data/ipfs -p 4001:4001 -p 4001:4001/udp -p 8080:8080 -p 5001:5001 ipfs/go-ipfs:latest
docker network connect fabric_test ipfs_host
docker exec ipfs_host ipfs config --bool Gateway.NoFetch true