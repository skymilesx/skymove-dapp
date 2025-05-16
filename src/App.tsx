import React from 'react';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Contract } from './contracts/SkyMoveToken';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers';
import { Contract as EthersContract } from '@ethersproject/contracts';

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  balance: string;
  allowance: string;
  buyFee: number;
  sellFee: number;
  transferFee: number;
  isPaused: boolean;
  isExcluded: boolean;
}

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    name: '',
    symbol: '',
    decimals: 0,
    totalSupply: '0',
    balance: '0',
    allowance: '0',
    buyFee: 0,
    sellFee: 0,
    transferFee: 0,
    isPaused: false,
    isExcluded: false,
  });
  const [loading, setLoading] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [spender, setSpender] = useState('');
  const [newFee, setNewFee] = useState('');
  const [isExcluded, setIsExcluded] = useState(false);

  const connectWallet = async () => {
    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setAccount(accounts[0]);
      await updateTokenInfo(accounts[0], provider);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const updateTokenInfo = async (address: string, provider: Web3Provider) => {
    const contract = new EthersContract(Contract.address, Contract.abi, provider);
    
    const [name, symbol, decimals, totalSupply, balance, allowance, buyFee, sellFee, transferFee, isPaused, isExcluded] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
      contract.balanceOf(address),
      contract.allowance(address, spender || address),
      contract.buyFee(),
      contract.sellFee(),
      contract.transferFee(),
      contract.paused(),
      contract.isExcludedFromFee(address)
    ]);

    setTokenInfo({
      name,
      symbol,
      decimals,
      totalSupply: formatUnits(totalSupply, decimals),
      balance: formatUnits(balance, decimals),
      allowance: formatUnits(allowance, decimals),
      buyFee: Number(buyFee),
      sellFee: Number(sellFee),
      transferFee: Number(transferFee),
      isPaused,
      isExcluded
    });
  };

  const executeFunction = async () => {
    try {
      setLoading(true);
      const provider = new Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      const contract = new EthersContract(Contract.address, Contract.abi, signer);

      const args = {
        recipient,
        amount: parseUnits(amount, 18),
        spender: spender || account,
        newFee: parseUnits(newFee, 0)
      };

      let tx;
      
      switch (selectedFunction) {
        case 'transfer':
          tx = await contract.transfer(args.recipient, args.amount);
          break;
        case 'approve':
          tx = await contract.approve(args.spender, args.amount);
          break;
        case 'transferFrom':
          tx = await contract.transferFrom(account!, args.recipient, args.amount);
          break;
        case 'setFeeExclusion':
          tx = await contract.setFeeExclusion(args.recipient, isExcluded);
          break;
        case 'setBuyFee':
          tx = await contract.setBuyFee(args.newFee);
          break;
        case 'setSellFee':
          tx = await contract.setSellFee(args.newFee);
          break;
        case 'setTransferFee':
          tx = await contract.setTransferFee(args.newFee);
          break;
        case 'pause':
          tx = await contract.pause();
          break;
        case 'unpause':
          tx = await contract.unpause();
          break;
      }

      await tx.wait();
      await updateTokenInfo(account!, provider);
    } catch (error) {
      console.error('Error executing function:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1rem'
    }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '1rem'
      }}>SkyMove Token</h1>
      
      <div style={{
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={connectWallet}
            style={{
              backgroundColor: account ? '#6366f1' : '#3b82f6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {account ? 'Connected' : 'Connect Wallet'}
          </button>
        </div>

        {account && (
          <div style={{ gap: '1rem' }}>
            {/* Token Info */}
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '1rem',
              borderRadius: '8px'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>Token Information</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem'
              }}>
                <p>Name: {tokenInfo.name}</p>
                <p>Symbol: {tokenInfo.symbol}</p>
                <p>Decimals: {tokenInfo.decimals}</p>
                <p>Total Supply: {tokenInfo.totalSupply}</p>
                <p>Your Balance: {tokenInfo.balance}</p>
                <p>Allowance: {tokenInfo.allowance}</p>
                <p>Buy Fee: {tokenInfo.buyFee}%</p>
                <p>Sell Fee: {tokenInfo.sellFee}%</p>
                <p>Transfer Fee: {tokenInfo.transferFee}%</p>
                <p>Paused: {tokenInfo.isPaused ? 'Yes' : 'No'}</p>
                <p>Excluded from Fees: {tokenInfo.isExcluded ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Function Selector */}
            <div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>Execute Function</h2>
              <select
                value={selectedFunction}
                onChange={(e) => setSelectedFunction(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}
              >
                <option value="">Select Function</option>
                <option value="transfer">Transfer Tokens</option>
                <option value="approve">Approve Allowance</option>
                <option value="transferFrom">Transfer From</option>
                <option value="setFeeExclusion">Set Fee Exclusion</option>
                <option value="setBuyFee">Set Buy Fee</option>
                <option value="setSellFee">Set Sell Fee</option>
                <option value="setTransferFee">Set Transfer Fee</option>
                <option value="pause">Pause Contract</option>
                <option value="unpause">Unpause Contract</option>
              </select>

              {/* Function Parameters */}
              <div>
                {['transfer', 'transferFrom', 'approve'].includes(selectedFunction) && (
                  <>
                    <input
                      type="text"
                      placeholder="Recipient/Spender Address"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        marginBottom: '0.5rem'
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        marginBottom: '0.5rem'
                      }}
                    />
                  </>
                )}
                {selectedFunction === 'setFeeExclusion' && (
                  <>
                    <input
                      type="text"
                      placeholder="Address"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        marginBottom: '0.5rem'
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <input
                        type="checkbox"
                        checked={isExcluded}
                        onChange={(e) => setIsExcluded(e.target.checked)}
                      />
                      <span>Exclude from fees</span>
                    </div>
                  </>
                )}
                {['setBuyFee', 'setSellFee', 'setTransferFee'].includes(selectedFunction) && (
                  <input
                    type="number"
                    placeholder="New Fee (in basis points)"
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      marginBottom: '0.5rem'
                    }}
                  />
                )}
              </div>

              <button
                onClick={executeFunction}
                disabled={loading || !selectedFunction}
                style={{
                  marginTop: '1rem',
                  backgroundColor: loading || !selectedFunction ? '#94a3b8' : '#10b981',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: loading || !selectedFunction ? 'not-allowed' : 'pointer',
                  width: '100%'
                }}
              >
                {loading ? 'Executing...' : 'Execute'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
