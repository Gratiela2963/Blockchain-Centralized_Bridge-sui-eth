import '@mysten/dapp-kit/dist/index.css';
import React, { useState, useEffect } from "react";
import { ConnectModal, useAutoConnectWallet, useCurrentAccount, useWallets } from '@mysten/dapp-kit';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import img1 from "../img/img1.png";

const Login = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loggedOut, setLoggedOut] = useState(false);

  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const wallets = useWallets();

  useEffect(() => {
    if (currentAccount && !loggedOut) {
      console.log("Current account detected:", currentAccount);
      navigate('/dashboard', {
        state: { walletType: currentAccount.provider === 'MetaMask' ? 'MetaMask' : 'SuiWallet', address: currentAccount.address },
      });
    }
  }, [currentAccount, loggedOut, navigate]);

  const connectMetaMask = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask and try again.");
      }
      await window.ethereum.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
      setErrorMessage("");
      console.log("MetaMask Account Connected:", accounts[0]);
      navigate('/dashboard', { state: { walletType: 'MetaMask', address: accounts[0] } });
    } catch (error) {
      setErrorMessage(error.message || "An unknown error occurred with MetaMask.");
      console.error("MetaMask connection error:", error);
    }
  };

  const isAnyWalletConnected = () => currentAccount !== null;

  return (
    <div className="login-page">
      {/* Partea stângă cu imaginea */}
      <div className="image-container">
        <img src={img1} alt="Background" className="login-image" />
      </div>

      {/* Partea dreaptă cu login */}
      <div className="login-container">
        <h1>Welcome to my Centralized Bridge App !</h1>
        <button
          onClick={connectMetaMask}
          className="button"
          disabled={isAnyWalletConnected()}
        >
          {walletAddress ? "Connected: " + walletAddress : "Connect with MetaMask"}
        </button>

        <ConnectModal
          trigger={
            <button
              className="button"
              disabled={isAnyWalletConnected()}
            >
              {currentAccount ? "Connected: " + currentAccount.address : "Connect with SuiWallet"}
            </button>
          }
          onConnect={() => {
            useAutoConnectWallet();
            setLoggedOut(true);
            setErrorMessage("");
            console.log("Sui Wallet Connected via ConnectModal");
          }}
          onDisconnect={() => {
            setWalletAddress(null);
            setLoggedOut(true);
            setErrorMessage("");
            console.log("Wallet Disconnected");
          }}
        />

        {errorMessage && <p className="error">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default Login;
