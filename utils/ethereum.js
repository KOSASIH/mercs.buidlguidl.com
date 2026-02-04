// utils/ethereum.js
import { ethers } from 'ethers';

// ABI for a sample NFT contract (replace with your actual ABI)
const NFT_CONTRACT_ABI = [
  'function mint(address to) public',
  'function balanceOf(address owner) public view returns (uint256)',
  'function tokenURI(uint256 tokenId) public view returns (string)',
];

// Contract address (replace with your deployed contract)
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;

let provider;
let signer;

/**
 * Connects to the user's Ethereum wallet (e.g., MetaMask).
 * @returns {Object} { provider, signer, address }
 */
export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not detected. Please install MetaMask.');
  }

  try {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    signer = provider.getSigner();
    const address = await signer.getAddress();
    return { provider, signer, address };
  } catch (error) {
    throw new Error('Failed to connect wallet: ' + error.message);
  }
};

/**
 * Mints an NFT for a participant.
 * @param {string} recipientAddress - The address to mint the NFT to.
 * @returns {Object} Transaction receipt.
 */
export const mintNFT = async (recipientAddress) => {
  if (!signer) {
    throw new Error('Wallet not connected. Call connectWallet first.');
  }

  try {
    const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);
    const tx = await contract.mint(recipientAddress);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    throw new Error('Failed to mint NFT: ' + error.message);
  }
};

/**
 * Checks the NFT balance of an address.
 * @param {string} address - The address to check.
 * @returns {number} Balance count.
 */
export const getNFTBalance = async (address) => {
  if (!provider) {
    throw new Error('Provider not initialized. Call connectWallet first.');
  }

  try {
    const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
    const balance = await contract.balanceOf(address);
    return balance.toNumber();
  } catch (error) {
    throw new Error('Failed to get NFT balance: ' + error.message);
  }
};

/**
 * Sends a transaction (e.g., for rewards or payments).
 * @param {string} to - Recipient address.
 * @param {string} amount - Amount in ETH (as string).
 * @returns {Object} Transaction receipt.
 */
export const sendTransaction = async (to, amount) => {
  if (!signer) {
    throw new Error('Wallet not connected. Call connectWallet first.');
  }

  try {
    const tx = await signer.sendTransaction({
      to,
      value: ethers.utils.parseEther(amount),
    });
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    throw new Error('Failed to send transaction: ' + error.message);
  }
};

/**
 * Listens for contract events (e.g., NFT transfers).
 * @param {Function} callback - Callback function for events.
 */
export const listenForEvents = (callback) => {
  if (!provider) {
    throw new Error('Provider not initialized.');
  }

  const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
  contract.on('Transfer', (from, to, tokenId) => {
    callback({ from, to, tokenId: tokenId.toString() });
  });
};

/**
 * Switches to a specific Ethereum network (e.g., Sepolia testnet).
 * @param {number} chainId - Chain ID (e.g., 11155111 for Sepolia).
 */
export const switchNetwork = async (chainId) => {
  if (!window.ethereum) {
    throw new Error('MetaMask not available.');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error) {
    throw new Error('Failed to switch network: ' + error.message);
  }
};
