import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useWallets, useDisconnectWallet, useCurrentAccount  } from "@mysten/dapp-kit";
import { SuiClient } from "@mysten/sui.js/client";
import {useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { bridgeTokens } from "./Bridge";
import Web3 from "web3";
import "../styles/Transfer.css";

const Transfer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: disconnectSui } = useDisconnectWallet();

  const currentAccount = useCurrentAccount();

  const [ibttBalance, setIbttBalance] = useState("0");
  const [walletType, setWalletType] = useState(
    location.state?.walletType || "Unknown"
  );
  const [address, setAddress] = useState(location.state?.address || "N/A");

  const [bridgeAmount, setBridgeAmount] = useState("");
  const [recvAddress, setRecvAddress] = useState("");

  useEffect(() => {
    (async () => {
      try {
        if (walletType === "MetaMask" && window.ethereum && address) {
          const IBTTOKEN_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";  ///deployed to 
          const web3 = new Web3(window.ethereum);
          const contract = new web3.eth.Contract(
            [
              {
                "constant": true,
                "inputs": [{ "name": "_owner", "type": "address" }],
                "name": "balanceOf",
                "outputs": [{ "name": "balance", "type": "uint256" }],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
              }
            ],
            IBTTOKEN_CONTRACT_ADDRESS
          );
          const balance = await contract.methods.balanceOf(address).call();
          setIbttBalance(web3.utils.fromWei(balance, 'ether'));
        } else if (walletType === "SuiWallet" && address) {
          const suiClient = new SuiClient({ url: "http://127.0.0.1:9000" });
          const IBTTOKEN_TYPE = "0x47efef0b0d5f7f5feb92fae5849b4aeb4ca3d88d585dc4ba8ac9a6569b91514e::IBTToken::IBTToken";  ///pk id de la sui
          const result = await suiClient.getBalance({
            owner: address,
            coinType: IBTTOKEN_TYPE
          });
          console.log('Full Balance Result:', JSON.stringify(result, null, 2));
          if (result && result.totalBalance) {
            const rawBalance = parseInt(result.totalBalance, 10);
            setIbttBalance(rawBalance.toString());
          } else {
            setIbttBalance("0");
          }
        }
      } catch (error) {
        console.error("Error fetching IBTToken balance:", error);
        setIbttBalance("Error fetching balance");
      }
    })();
  }, [walletType, address]);

  const handleLogout = async () => {
    try {
      if (walletType === "SuiWallet") {
        await disconnectSui();
      } else if (walletType === "MetaMask") {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      }
      setWalletType("Unknown");
      setAddress("N/A");
      setIbttBalance("0");
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleBridge = async () => {
    try {
      console.log("Starting token bridge...");
  
      if (!currentAccount) {
        console.error("FAIL: No current account.");
      } else {
        console.log("PASS: Account found.");
      }
  
      const destinationChain = walletType === "MetaMask" ? "Sui" : "Ethereum";
      let bridgeResult;
      console.log("x" + walletType);
      if (walletType === "MetaMask") {
        console.log("MetaMask wallet detected. Initiating bridge process...");
        bridgeResult = await bridgeTokens(walletType, recvAddress, bridgeAmount, destinationChain, currentAccount);
  
        const mintResponse = await fetch("http://localhost:3000/api/mint", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recvAddress, amount: bridgeAmount, destinationChain: "Sui" }),
        });
  
        if (!mintResponse.ok) {
          throw new Error(await mintResponse.text());
        }
  
        console.log("Minting response:", await mintResponse.json());
      } else if (walletType === "SuiWallet") {
        console.log("Sui wallet detected. Initiating bridge process...");
        bridgeResult = await bridgeTokens(walletType, recvAddress, bridgeAmount, destinationChain, currentAccount);
      }
  
      console.log("Bridge process complete.", bridgeResult);
    } catch (error) {
      console.error("Error in bridging:", error);
    }
  };
  
  

  const formattedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-heading">Centralized Bridge</h1>
      <div className="wallet-info">
        <p>
          <strong>Coins Type:</strong> {walletType}
        </p>
        <p>
          <strong>Address:</strong> {formattedAddress}
        </p>
        <p>
          <strong>Balance:</strong> {ibttBalance} IBT
        </p>
      </div>

      <div className="options">
        <input
          type="number"
          value={bridgeAmount}
          onChange={(e) => setBridgeAmount(e.target.value)}
          placeholder="Value to transfer"
        />
        <input
          type="text"
          value={recvAddress}
          onChange={(e) => setRecvAddress(e.target.value)}
          placeholder="Receiving Address"
        />
        <button onClick={handleBridge} className="dashboard-button">Send</button>
      </div>

      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
};

export default Transfer;