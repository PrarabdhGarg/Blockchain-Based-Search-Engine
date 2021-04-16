package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"strconv"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"

	shell "github.com/ipfs/go-ipfs-api"
)

// SmartContract provides functions for managing an dictionary of words
type SmartContract struct {
	contractapi.Contract
}

// Word struct
type Word struct {
	ID   string `json:"ID"`
	Path string `json:"path"`
}

// InitLedger adds a base set of words to the ledger
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	words := []Word{
		{ID: "word1", Path: "300"},
		{ID: "word2", Path: "400"},
		{ID: "word3", Path: "500"},
		{ID: "word4", Path: "600"},
		{ID: "word5", Path: "700"},
		{ID: "word6", Path: "800"},
	}

	for _, word := range words {
		wordJSON, err := json.Marshal(word)
		if err != nil {
			return err
		}

		err = ctx.GetStub().PutState(word.ID, wordJSON)
		if err != nil {
			return fmt.Errorf("failed to put to world state. %v", err)
		}
	}

	return nil
}

// CreateWord adds a new word to the world state with given details.
func (s *SmartContract) CreateWord(ctx contractapi.TransactionContextInterface, id string, path string) error {
	fmt.Println("Starting create Word ", id, "  ", path)
	exists, err := s.WordExists(ctx, id)
	if err != nil {
		fmt.Println("Error in finding existance ", err)
		return err
	}
	if exists {
		fmt.Println("Error word already exists")
		return fmt.Errorf("the word %s already exists", id)
	}

	word := Word{
		ID:   id,
		Path: path,
	}
	wordJSON, err := json.Marshal(word)
	if err != nil {
		return err
	}
	fmt.Println("Word Json ", string(wordJSON))

	err1 := ctx.GetStub().PutState(id, wordJSON)
	fmt.Println("Error in updating state ", err1)
	if err1 != nil {
		fmt.Println("Error in updating state ", err1)
		return err1
	}
	return nil
}

// ReadWord returns the word stored in the world state with given id.
func (s *SmartContract) ReadWord(ctx contractapi.TransactionContextInterface, id string) (*Word, error) {

	fmt.Println("Start of read word")

	wordJSON, err := ctx.GetStub().GetState(id)
	fmt.Println("WordJson = ", wordJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if wordJSON == nil {
		// return nil, fmt.Errorf("the word %s does not exist", id)
		// return nil, errors.New("WordNotFound")
		// word := Word{
		// 	ID:   id,
		// 	Path: ' ',
		// }
		fmt.Println("Word Doesn't exist ", id)
		return nil, nil
	}

	var word Word
	err = json.Unmarshal(wordJSON, &word)
	if err != nil {
		return nil, err
	}

	return &word, nil
}

// UpdateWord updates an existing word in the world state with provided parameters.
func (s *SmartContract) UpdateWord(ctx contractapi.TransactionContextInterface, id string, path string) error {
	exists, err := s.WordExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("the word %s does not exist", id)
	}
	fmt.Println("Exists = ", exists)
	// overwriting original word with new word
	word := Word{
		ID:   id,
		Path: path,
	}
	wordJSON, err := json.Marshal(word)
	if err != nil {
		return err
	}
	delErr := ctx.GetStub().DelState(id)
	if delErr != nil {
		fmt.Println("Error in deleting state")
		return delErr
	}
	fmt.Println("State Deleted sucessfully")
	return ctx.GetStub().PutState(id, wordJSON)
}

// WordExists returns true when word with given ID exists in world state
func (s *SmartContract) WordExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	wordJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return wordJSON != nil, nil
}

func (s *SmartContract) Lookup(ctx contractapi.TransactionContextInterface, search string) (map[string]int, error) {
	search = strings.ToLower(search)
	split := strings.Split(search, " ")

	str := ""

	searchMap := map[string]int{}

	for _, term := range split {
		fmt.Println("Word :", term)
		word, err := s.ReadWord(ctx, term)

		fmt.Println("read word done", term)

		if err != nil {
			continue
		}

		fmt.Println("No read word error", term)

		path := (*word).Path
		sh := shell.NewShell("ipfs_host:5001")

		fmt.Println("Path : ", path)

		catResult, err := sh.Cat(path)
		fmt.Println("After Cat Result")

		if err != nil {
			fmt.Println("Error in reading IPFS ", err)
			// return "", err
			continue
		}
		defer catResult.Close()

		buf := new(bytes.Buffer)
		buf.ReadFrom(catResult)

		message := buf.String()
		urls := strings.Split(message, "\n")
		for _, url := range urls {
			fmt.Println("URL = ", url)
			info := strings.Split(url, "\t")
			if len(info) == 2 {
				fmt.Println("Info = ", info[0], " ", info[1])
				_, ok := searchMap[info[0]]
				freq, err := strconv.Atoi(info[1])
				if err != nil {
					fmt.Println("Errror in converting freq to int ", err)
					continue
				}
				fmt.Println("Frequency = ", freq)
				if ok {
					searchMap[info[0]] += freq
				} else {
					searchMap[info[0]] = freq
				}
			}
		}

		str += message

		fmt.Printf("Read file contents : %s", message)

	}
	fmt.Println("Result String = ", str)

	return searchMap, nil

}

func main() {
	wordChaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating search_contract chaincode: %v", err)
	}

	if err := wordChaincode.Start(); err != nil {
		log.Panicf("Error starting search_contract chaincode: %v", err)
	}
}
