// components/CohortManager.js
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

const CohortManager = ({ cohortId }) => {
  const [participants, setParticipants] = useState([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    // Fetch participants from API
    const fetchParticipants = async () => {
      try {
        const response = await axios.get(`/api/cohorts/${cohortId}/participants`);
        setParticipants(response.data);
      } catch (err) {
        console.error('Failed to fetch participants');
      }
    };
    fetchParticipants();
  }, [cohortId]);

  const connectWallet = async () => {
    if (window.ethereum) {
      const prov = new ethers.providers.Web3Provider(window.ethereum);
      await prov.send('eth_requestAccounts', []);
      const signer = prov.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      setProvider(prov);
    } else {
      alert('MetaMask required');
    }
  };

  const addParticipant = async () => {
    if (newParticipant.trim()) {
      try {
        await axios.post(`/api/cohorts/${cohortId}/participants`, {
          name: newParticipant,
          wallet: walletAddress,
        });
        setParticipants([...participants, { name: newParticipant, wallet: walletAddress, role: 'member' }]);
        setNewParticipant('');
      } catch (err) {
        console.error('Failed to add participant');
      }
    }
  };

  const assignRole = (index, role) => {
    const updated = [...participants];
    updated[index].role = role;
    setParticipants(updated);
    // Persist to API
    axios.put(`/api/cohorts/${cohortId}/participants/${updated[index].id}`, { role });
  };

  const mintNFT = async (participant) => {
    if (provider && participant.wallet) {
      const signer = provider.getSigner();
      // Example: Interact with a smart contract (replace with your contract ABI/address)
      const contract = new ethers.Contract('YOUR_CONTRACT_ADDRESS', ['function mint(address)'], signer);
      await contract.mint(participant.wallet);
      alert('NFT minted!');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl mb-4">Cohort Manager</h2>
      <button
        onClick={connectWallet}
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...` : 'Connect Wallet'}
      </button>
      <div className="mb-4">
        <input
          value={newParticipant}
          onChange={(e) => setNewParticipant(e.target.value)}
          placeholder="Add participant name"
          className="p-2 border rounded w-full"
        />
        <button
          onClick={addParticipant}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add
        </button>
      </div>
      <ul>
        {participants.map((p, i) => (
          <li key={i} className="flex justify-between items-center p-2 border-b">
            <span>{p.name} ({p.role}) - Wallet: {p.wallet || 'None'}</span>
            <div>
              <select
                value={p.role}
                onChange={(e) => assignRole(i, e.target.value)}
                className="mr-2 p-1 border rounded"
              >
                <option value="member">Member</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={() => mintNFT(p)}
                className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                disabled={!p.wallet}
              >
                Mint NFT
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CohortManager;
